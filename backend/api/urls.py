from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, ShiftViewSet, ShiftAssignmentViewSet, AbsenceViewSet

router = DefaultRouter()
router.register(r'staff', StaffViewSet)
router.register(r'shifts', ShiftViewSet)
router.register(r'absences', AbsenceViewSet)
router.register(r'assignments', ShiftAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
