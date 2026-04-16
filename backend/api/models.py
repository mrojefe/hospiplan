from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class Staff(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "staff"


class Role(models.Model):
    name = models.CharField(max_length=100)
    staff = models.ManyToManyField(Staff, db_table="staff_role", related_name="roles")

    class Meta:
        db_table = "role"


class Specialty(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)
    staff = models.ManyToManyField(
        Staff, db_table="staff_specialty", related_name="specialties"
    )

    class Meta:
        db_table = "specialty"


class ContractType(models.Model):
    name = models.CharField(max_length=50)
    max_hours_per_week = models.IntegerField(null=True, blank=True)
    leave_days_per_year = models.IntegerField(null=True, blank=True)
    night_shift_allowed = models.BooleanField(default=True)

    class Meta:
        db_table = "contract_type"


class Contract(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="contracts")
    contract_type = models.ForeignKey(ContractType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    workload_percent = models.IntegerField(default=100)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "contract"
        indexes = [
            models.Index(
                fields=["staff"],
                name="idx_active_contract",
                condition=models.Q(end_date__isnull=True),
            ),
        ]


class Certification(models.Model):
    name = models.CharField(max_length=150)
    dependencies = models.ManyToManyField(
        "self",
        symmetrical=False,
        db_table="certification_dependency",
        related_name="required_by",
    )

    class Meta:
        db_table = "certification"


class StaffCertification(models.Model):
    staff = models.ForeignKey(
        Staff, on_delete=models.CASCADE, related_name="certifications"
    )
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    obtained_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "staff_certification"


class Service(models.Model):
    name = models.CharField(max_length=100)
    manager = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_services",
    )
    bed_capacity = models.IntegerField()
    criticality_level = models.IntegerField(default=1)

    class Meta:
        db_table = "service"


class CareUnit(models.Model):
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="care_units"
    )
    name = models.CharField(max_length=100)

    class Meta:
        db_table = "care_unit"


class ServiceStatus(models.Model):
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="statuses"
    )
    status = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "service_status"
        indexes = [
            models.Index(
                fields=["service"],
                name="idx_active_service_status",
                condition=models.Q(end_date__isnull=True),
            ),
        ]


class StaffServiceAssignment(models.Model):
    staff = models.ForeignKey(
        Staff, on_delete=models.CASCADE, related_name="service_assignments"
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "staff_service_assignment"
        indexes = [
            models.Index(
                fields=["staff"],
                name="idx_active_service_assig",
                condition=models.Q(end_date__isnull=True),
            ),
        ]


class ShiftType(models.Model):
    name = models.CharField(max_length=50)
    duration_hours = models.IntegerField()
    requires_rest_after = models.BooleanField(default=True)

    class Meta:
        db_table = "shift_type"


class Shift(models.Model):
    care_unit = models.ForeignKey(
        CareUnit, on_delete=models.CASCADE, related_name="shifts"
    )
    shift_type = models.ForeignKey(ShiftType, on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    min_staff = models.IntegerField(default=1)
    max_staff = models.IntegerField(null=True, blank=True)
    required_certifications = models.ManyToManyField(
        Certification, db_table="shift_required_certification", blank=True
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "shift"


class ShiftAssignment(models.Model):
    shift = models.ForeignKey(
        Shift, on_delete=models.RESTRICT, related_name="assignments"
    )
    staff = models.ForeignKey(
        Staff, on_delete=models.RESTRICT, related_name="shift_assignments"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "shift_assignment"


class AbsenceType(models.Model):
    name = models.CharField(max_length=50)
    impacts_quota = models.BooleanField(default=True)

    class Meta:
        db_table = "absence_type"


class Absence(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="absences")
    absence_type = models.ForeignKey(AbsenceType, on_delete=models.CASCADE)
    start_date = models.DateField()
    expected_end_date = models.DateField()
    actual_end_date = models.DateField(null=True, blank=True)
    is_planned = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "absence"


class Preference(models.Model):
    staff = models.ForeignKey(
        Staff, on_delete=models.CASCADE, related_name="preferences"
    )
    type = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_hard_constraint = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "preference"


class PatientLoad(models.Model):
    care_unit = models.ForeignKey(
        CareUnit, on_delete=models.CASCADE, related_name="patient_loads"
    )
    date = models.DateField()
    patient_count = models.IntegerField()
    occupancy_rate = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "patient_load"


class StaffLoan(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="loans")
    from_service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="+"
    )
    to_service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="+")
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        db_table = "staff_loan"


class Rule(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    rule_type = models.CharField(max_length=50, null=True, blank=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, null=True, blank=True)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "rule"


class AuditLog(models.Model):
    """Journal d'audit pour tracer toutes les actions sur les affectations"""

    ACTION_CHOICES = [
        ("CREATE", "Creation"),
        ("UPDATE", "Modification"),
        ("DELETE", "Suppression"),
        ("VALIDATE", "Validation contraintes"),
        ("REJECT", "Rejet contraintes"),
    ]

    user = models.ForeignKey(
        "auth.User", on_delete=models.SET_NULL, null=True, blank=True
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    staff = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    shift = models.ForeignKey(
        Shift,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(
        null=True, blank=True
    )  # Stockage flexible des changements
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "audit_log"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"], name="idx_audit_timestamp"),
            models.Index(fields=["staff"], name="idx_audit_staff"),
            models.Index(fields=["action"], name="idx_audit_action"),
        ]
