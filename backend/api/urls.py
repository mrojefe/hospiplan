from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SoignantViewSet, PosteGardeViewSet, AffectationViewSet, AbsenceViewSet

router = DefaultRouter()
router.register(r'soignants', SoignantViewSet)
router.register(r'postes', PosteGardeViewSet)
router.register(r'absences', AbsenceViewSet)
router.register(r'affectations', AffectationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
