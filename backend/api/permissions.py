"""
Permissions personnalisées pour HospiPlan
"""
from rest_framework import permissions


class IsServiceManager(permissions.BasePermission):
    """
    Permission qui vérifie si l'utilisateur est manager du service concerné.
    Un responsable de service peut modifier les affectations de son service mais pas des autres.
    """
    def has_permission(self, request, view):
        # Authentification requise
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        # Les superusers ont tous les droits
        if request.user.is_superuser:
            return True
        
        # Vérifier si l'utilisateur est manager du service concerné
        # obj doit avoir un attribut qui mène au service (shift.care_unit.service)
        try:
            if hasattr(obj, 'shift'):
                service = obj.shift.care_unit.service
            elif hasattr(obj, 'care_unit'):
                service = obj.care_unit.service
            elif hasattr(obj, 'service'):
                service = obj.service
            else:
                return False
            
            # Vérifier si l'utilisateur est manager de ce service
            return service.manager_id == request.user.id
        except AttributeError:
            return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission qui autorise la lecture à tous les authentifiés,
    mais la modification uniquement aux admins.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.is_staff or request.user.is_superuser


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission qui autorise la modification uniquement au propriétaire de l'objet
    ou aux administrateurs.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superuser = tous les droits
        if request.user.is_superuser:
            return True
        
        # Vérifier si l'objet appartient à l'utilisateur
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'staff'):
            # Vérifier si le staff est lié à l'utilisateur
            return hasattr(request.user, 'staff') and obj.staff == request.user.staff
        
        return False
