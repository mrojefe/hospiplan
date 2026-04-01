from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.db import transaction
import datetime

from .models import Staff, Shift, ShiftAssignment, Absence, Rule, Contract, StaffCertification
from .serializers import StaffSerializer, ShiftSerializer, ShiftAssignmentSerializer, AbsenceSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer

class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer

class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all()
    serializer_class = AbsenceSerializer

class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ShiftAssignment.objects.all()
    serializer_class = ShiftAssignmentSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        shift = serializer.validated_data['shift']
        
        # VERROU DE LA BDD (Anti Race-Condition)
        # On verrouille la ligne du soignant pendant toute la validation
        staff_id = serializer.validated_data['staff'].id
        staff = Staff.objects.select_for_update().get(id=staff_id)
        
        # Validation des contraintes dures (Phase 2)
        self.validate_assignment_hard_constraints(staff, shift)
        serializer.save()

    def validate_assignment_hard_constraints(self, staff, shift):
        # 1. Chevauchement horaires
        chevauchement = ShiftAssignment.objects.filter(
            staff=staff,
            shift__start_datetime__lt=shift.end_datetime,
            shift__end_datetime__gt=shift.start_datetime
        ).exists()
        if chevauchement:
            raise ValidationError("The staff member already has an assignment during this time frame.")

        # 2. Certifications
        for certif in shift.required_certifications.all():
            has_certif = StaffCertification.objects.filter(
                staff=staff,
                certification=certif,
                obtained_date__lte=shift.start_datetime.date()
            ).filter(
                Q(expiration_date__isnull=True) | Q(expiration_date__gte=shift.end_datetime.date())
            ).exists()
            if not has_certif:
                raise ValidationError(f"The staff member lacks the required certification: {certif.name}")

        # 3. Repos post nuit obligatoire
        rule_rest = Rule.objects.filter(rule_type='REST_TIME_POST_NIGHT').first()
        rest_hours = float(rule_rest.value) if rule_rest else 11.0
        
        if shift.shift_type.requires_rest_after: # Assuming requires_rest_after refers to Night shifts or intense shifts
            pass # We calculate rest before this new shift
            
        last_night_shift = ShiftAssignment.objects.filter(
            staff=staff,
            shift__shift_type__requires_rest_after=True,
            shift__end_datetime__lte=shift.start_datetime
        ).order_by('-shift__end_datetime').first()
        
        if last_night_shift:
            hours_rest = (shift.start_datetime - last_night_shift.shift.end_datetime).total_seconds() / 3600.0
            if hours_rest < rest_hours:
                raise ValidationError(f"Mandatory rest period of {rest_hours}h not respected. Only {int(hours_rest)}h passed.")

        # 4. Autorisation du contrat
        active_contract = Contract.objects.filter(
            staff=staff,
            start_date__lte=shift.start_datetime.date()
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=shift.end_datetime.date())
        ).first()

        if not active_contract:
            raise ValidationError("No active contract found for this date.")
            
        if shift.shift_type.requires_rest_after and not active_contract.contract_type.night_shift_allowed:
            raise ValidationError(f"Contract type {active_contract.contract_type.name} does not allow night/intense shifts.")

        # 5. Absence
        in_absence = Absence.objects.filter(
            staff=staff,
            start_date__lte=shift.end_datetime.date()
        ).filter(
            Q(actual_end_date__isnull=True, expected_end_date__gte=shift.start_datetime.date()) |
            Q(actual_end_date__gte=shift.start_datetime.date())
        ).exists()
        if in_absence:
            raise ValidationError("Staff is marked as absent or on sick leave during this period.")

        # 6. Heures max hebdos
        max_weekly = active_contract.contract_type.max_hours_per_week
        if max_weekly:
            start_week = shift.start_datetime - datetime.timedelta(days=shift.start_datetime.weekday())
            end_week = start_week + datetime.timedelta(days=6)
            
            week_assignments = ShiftAssignment.objects.filter(
                staff=staff,
                shift__start_datetime__gte=start_week,
                shift__start_datetime__lte=end_week
            )
            total_hours = sum([(g.shift.end_datetime - g.shift.start_datetime).total_seconds()/3600.0 for g in week_assignments])
            future_shift_hours = (shift.end_datetime - shift.start_datetime).total_seconds() / 3600.0
            
            if (total_hours + future_shift_hours) > float(max_weekly):
                raise ValidationError(f"Weekly maximum of {max_weekly}h exceeded.")
