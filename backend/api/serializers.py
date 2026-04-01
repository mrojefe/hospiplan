from rest_framework import serializers
from .models import Staff, Shift, ShiftAssignment, Absence, AbsenceType, Role

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)

    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'is_active', 'roles']

class ShiftSerializer(serializers.ModelSerializer):
    care_unit_name = serializers.CharField(source='care_unit.name', read_only=True)
    shift_type_name = serializers.CharField(source='shift_type.name', read_only=True)

    class Meta:
        model = Shift
        fields = ['id', 'care_unit', 'care_unit_name', 'shift_type', 'shift_type_name', 'start_datetime', 'end_datetime', 'min_staff', 'max_staff']

class ShiftAssignmentSerializer(serializers.ModelSerializer):
    staff_first_name = serializers.CharField(source='staff.first_name', read_only=True)
    staff_last_name = serializers.CharField(source='staff.last_name', read_only=True)
    shift_start = serializers.DateTimeField(source='shift.start_datetime', read_only=True)
    shift_end = serializers.DateTimeField(source='shift.end_datetime', read_only=True)

    class Meta:
        model = ShiftAssignment
        fields = ['id', 'shift', 'staff', 'assigned_at', 'staff_first_name', 'staff_last_name', 'shift_start', 'shift_end']

class AbsenceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceType
        fields = '__all__'

class AbsenceSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='absence_type.name', read_only=True)

    class Meta:
        model = Absence
        fields = ['id', 'staff', 'absence_type', 'type_name', 'start_date', 'expected_end_date', 'actual_end_date', 'is_planned']
