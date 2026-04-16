from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, F, ExpressionWrapper, DurationField
from django.db import transaction
from django.utils import timezone
import datetime

from .models import (
    Staff,
    Shift,
    ShiftAssignment,
    Absence,
    Rule,
    Contract,
    StaffCertification,
    Preference,
    Service,
    AuditLog,
)
from .serializers import (
    StaffSerializer,
    ShiftSerializer,
    ShiftAssignmentSerializer,
    AbsenceSerializer,
)
from .permissions import IsServiceManager, IsAdminOrReadOnly


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.prefetch_related(
        "roles", "certifications", "contracts"
    ).all()
    serializer_class = StaffSerializer
    permission_classes = [IsAdminOrReadOnly]


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = (
        Shift.objects.select_related("care_unit", "care_unit__service", "shift_type")
        .prefetch_related("required_certifications")
        .filter(deleted_at__isnull=True)  # Uniquement les actifs
    )
    serializer_class = ShiftSerializer
    permission_classes = [IsAdminOrReadOnly]


class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.filter(deleted_at__isnull=True)
    serializer_class = AbsenceSerializer
    permission_classes = [IsAuthenticated]


class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = (
        ShiftAssignment.objects.select_related("staff", "shift", "shift__care_unit")
        .prefetch_related("shift__required_certifications")
        .filter(deleted_at__isnull=True)  # Uniquement les actives
    )
    serializer_class = ShiftAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def _log_action(self, action, instance=None, details=None, error=None):
        """Log une action dans le journal d'audit"""
        try:
            request = self.request
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action=action,
                model_name="ShiftAssignment",
                object_id=instance.id if instance else None,
                staff=instance.staff if instance else None,
                shift=instance.shift if instance else None,
                details={
                    "error": str(error) if error else None,
                    "data": details,
                    "ip": request.META.get("REMOTE_ADDR"),
                },
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:200],
            )
        except Exception:
            pass  # Ne pas bloquer l'opération si le logging échoue

    @transaction.atomic
    def perform_create(self, serializer):
        shift = serializer.validated_data["shift"]

        # VERROU DE LA BDD (Anti Race-Condition)
        staff_id = serializer.validated_data["staff"].id
        staff = Staff.objects.select_for_update().get(id=staff_id)

        # Validation des contraintes dures
        try:
            self.validate_assignment_hard_constraints(staff, shift)
        except ValidationError as e:
            # Log du rejet
            self._log_action(
                "REJECT", details={"staff_id": staff.id, "shift_id": shift.id}, error=e
            )
            # Retourner 409 Conflict pour les violations de concurrence
            if (
                "already has an assignment" in str(e).lower()
                or "conflict" in str(e).lower()
            ):
                e.status_code = 409
            raise

        instance = serializer.save()
        # Log de la création réussie
        self._log_action("CREATE", instance=instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log_action("UPDATE", instance=instance)

    def perform_destroy(self, instance):
        # Soft delete au lieu de hard delete
        instance.deleted_at = timezone.now()
        instance.save()
        self._log_action("DELETE", instance=instance, details={"soft_delete": True})

    def validate_assignment_hard_constraints(self, staff, shift):
        # 1. Chevauchement horaires (uniquement les affectations actives)
        chevauchement = ShiftAssignment.objects.filter(
            staff=staff,
            deleted_at__isnull=True,  # Exclure les suppressions logiques
            shift__start_datetime__lt=shift.end_datetime,
            shift__end_datetime__gt=shift.start_datetime,
        ).exists()
        if chevauchement:
            raise ValidationError(
                "The staff member already has an assignment during this time frame."
            )

        # 2. Certifications
        for certif in shift.required_certifications.all():
            has_certif = (
                StaffCertification.objects.filter(
                    staff=staff,
                    certification=certif,
                    obtained_date__lte=shift.start_datetime.date(),
                )
                .filter(
                    Q(expiration_date__isnull=True)
                    | Q(expiration_date__gte=shift.end_datetime.date())
                )
                .exists()
            )
            if not has_certif:
                raise ValidationError(
                    f"The staff member lacks the required certification: {certif.name}"
                )

        # 3. Repos post nuit obligatoire
        rule_rest = Rule.objects.filter(rule_type="REST_TIME_POST_NIGHT").first()
        rest_hours = float(rule_rest.value) if rule_rest else 11.0

        last_night_shift = (
            ShiftAssignment.objects.filter(
                staff=staff,
                deleted_at__isnull=True,
                shift__shift_type__requires_rest_after=True,
                shift__end_datetime__lte=shift.start_datetime,
            )
            .order_by("-shift__end_datetime")
            .first()
        )

        if last_night_shift:
            hours_rest = (
                shift.start_datetime - last_night_shift.shift.end_datetime
            ).total_seconds() / 3600.0
            if hours_rest < rest_hours:
                raise ValidationError(
                    f"Mandatory rest period of {rest_hours}h not respected. Only {int(hours_rest)}h passed."
                )

        # 4. Autorisation du contrat
        active_contract = (
            Contract.objects.filter(
                staff=staff, start_date__lte=shift.start_datetime.date()
            )
            .filter(
                Q(end_date__isnull=True) | Q(end_date__gte=shift.end_datetime.date())
            )
            .first()
        )

        if not active_contract:
            raise ValidationError("No active contract found for this date.")

        if (
            shift.shift_type.requires_rest_after
            and not active_contract.contract_type.night_shift_allowed
        ):
            raise ValidationError(
                f"Contract type {active_contract.contract_type.name} does not allow night/intense shifts."
            )

        # 5. Absence
        in_absence = (
            Absence.objects.filter(
                staff=staff, start_date__lte=shift.end_datetime.date()
            )
            .filter(
                Q(
                    actual_end_date__isnull=True,
                    expected_end_date__gte=shift.start_datetime.date(),
                )
                | Q(actual_end_date__gte=shift.start_datetime.date())
            )
            .exists()
        )
        if in_absence:
            raise ValidationError(
                "Staff is marked as absent or on sick leave during this period."
            )

        # 6. Heures max hebdos
        max_weekly = active_contract.contract_type.max_hours_per_week
        if max_weekly:
            start_week = shift.start_datetime - datetime.timedelta(
                days=shift.start_datetime.weekday()
            )
            end_week = start_week + datetime.timedelta(days=6)

            week_assignments = ShiftAssignment.objects.filter(
                staff=staff,
                shift__start_datetime__gte=start_week,
                shift__start_datetime__lte=end_week,
            )
            total_hours = sum(
                [
                    (g.shift.end_datetime - g.shift.start_datetime).total_seconds()
                    / 3600.0
                    for g in week_assignments
                ]
            )
            future_shift_hours = (
                shift.end_datetime - shift.start_datetime
            ).total_seconds() / 3600.0

            if (total_hours + future_shift_hours) > float(max_weekly):
                raise ValidationError(f"Weekly maximum of {max_weekly}h exceeded.")

        # 7. Contraintes impératives F-07 - Préférences du soignant
        hard_constraints = Preference.objects.filter(
            staff=staff,
            is_hard_constraint=True,
            start_date__lte=shift.end_datetime.date(),
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=shift.start_datetime.date())
        )
        for constraint in hard_constraints:
            raise ValidationError(
                f"F-07 Hard constraint violated: {constraint.type} - {constraint.description or 'No details'}"
            )

        # 8. Seuil de sécurité du service - Vérifier le ratio lits/soignants
        service = shift.care_unit.service
        min_staff_rule = (
            Rule.objects.filter(
                rule_type="MIN_STAFF_RATIO", valid_from__lte=shift.start_datetime.date()
            )
            .filter(
                Q(valid_to__isnull=True) | Q(valid_to__gte=shift.start_datetime.date())
            )
            .first()
        )

        if min_staff_rule:
            # Compter les affectations actuellement de service pendant ce créneau horaire
            # (uniquement les affectations actives non supprimées)
            current_assignments = (
                ShiftAssignment.objects.filter(
                    shift__care_unit__service=service,
                    deleted_at__isnull=True,  # Uniquement les actives
                    shift__start_datetime__lt=shift.end_datetime,  # Chevauchement
                    shift__end_datetime__gt=shift.start_datetime,
                )
                .exclude(id=shift.id)  # Exclure le shift actuel si déjà en base
                .count()
            )

            # Calculer le minimum requis basé sur la capacité
            required_staff = int(service.bed_capacity / float(min_staff_rule.value))

            if (current_assignments + 1) < required_staff:
                raise ValidationError(
                    f"Service safety threshold violated. Service '{service.name}' requires "
                    f"at least {required_staff} staff for {service.bed_capacity} beds "
                    f"(ratio 1:{min_staff_rule.value}). Currently: {current_assignments} staff on duty"
                )
