from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import StaffViewSet, ShiftViewSet, ShiftAssignmentViewSet, AbsenceViewSet

router = DefaultRouter()
router.register(r"staff", StaffViewSet)
router.register(r"shifts", ShiftViewSet)
router.register(r"absences", AbsenceViewSet)
router.register(r"assignments", ShiftAssignmentViewSet)

urlpatterns = [
    path("", include(router.urls)),
    # JWT Authentication endpoints
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verify/", TokenVerifyView.as_view(), name="token_verify"),
]
