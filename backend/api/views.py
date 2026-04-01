from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
import datetime

from .models import Soignant, PosteGarde, Affectation, Absence, RegleLegale, Contrat, SoignantCertification
from .serializers import SoignantSerializer, PosteGardeSerializer, AffectationSerializer, AbsenceSerializer

class SoignantViewSet(viewsets.ModelViewSet):
    queryset = Soignant.objects.all()
    serializer_class = SoignantSerializer

class PosteGardeViewSet(viewsets.ModelViewSet):
    queryset = PosteGarde.objects.all()
    serializer_class = PosteGardeSerializer

class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all()
    serializer_class = AbsenceSerializer

class AffectationViewSet(viewsets.ModelViewSet):
    queryset = Affectation.objects.all()
    serializer_class = AffectationSerializer

    def perform_create(self, serializer):
        soignant = serializer.validated_data['soignant']
        poste = serializer.validated_data['poste']
        
        # Validation des contraintes dures (Hard Constraints F-10 / Phase 2)
        self.validate_affectation_hard_constraints(soignant, poste)
        serializer.save()

    def validate_affectation_hard_constraints(self, soignant, poste):
        # 1. Chevauchement horaires
        chevauchement = Affectation.objects.filter(
            soignant=soignant,
            statut='VALIDE',
            poste__debut_prevu__lt=poste.fin_prevue,
            poste__fin_prevue__gt=poste.debut_prevu
        ).exists()
        if chevauchement:
            raise ValidationError("Le soignant a déjà une affectation sur ce créneau horaire.")

        # 2. Certifications
        for certif in poste.certifications_requises.all():
            has_certif = SoignantCertification.objects.filter(
                soignant=soignant,
                certification=certif,
                date_obtention__lte=poste.debut_prevu.date()
            ).filter(
                Q(date_expiration__isnull=True) | Q(date_expiration__gte=poste.fin_prevue.date())
            ).exists()
            if not has_certif:
                raise ValidationError(f"Le soignant manque la certification requise ou expirée : {certif.libelle}")

        # 3. Repos post nuit obligatoire
        regle_repos = RegleLegale.objects.filter(code='REPOS_MIN_POST_NUIT').first()
        repos_heures = float(regle_repos.valeur_numerique) if regle_repos else 11.0
        
        dernieres_gardes_nuits = Affectation.objects.filter(
            soignant=soignant,
            statut='VALIDE',
            poste__type_garde__is_nuit=True,
            poste__fin_prevue__lte=poste.debut_prevu
        ).order_by('-poste__fin_prevue').first()
        
        if dernieres_gardes_nuits:
            heures_repos = (poste.debut_prevu - dernieres_gardes_nuits.poste.fin_prevue).total_seconds() / 3600.0
            if heures_repos < repos_heures:
                raise ValidationError(f"Le soignant n'a pas respecté le repos obligatoire de {repos_heures}h après une nuit. (Repos de {int(heures_repos)}h constaté)")

        # 4. Autorisation du contrat et type d'heure
        contrat_actif = Contrat.objects.filter(
            soignant=soignant,
            date_debut__lte=poste.debut_prevu.date()
        ).filter(
            Q(date_fin__isnull=True) | Q(date_fin__gte=poste.fin_prevue.date())
        ).first()

        if not contrat_actif:
            raise ValidationError("Le soignant n'a aucun contrat actif à la date de la garde.")
            
        if poste.type_garde.is_nuit and not soignant.grade.eligibilite_garde_nuit:
            raise ValidationError(f"Le grade '{soignant.grade.libelle}' n'est pas éligible aux gardes de nuit.")

        # 5. Absence
        en_absence = Absence.objects.filter(
            soignant=soignant,
            date_debut__lte=poste.fin_prevue.date()
        ).filter(
            Q(date_fin_reelle__isnull=True, date_fin_prevue__gte=poste.debut_prevu.date()) |
            Q(date_fin_reelle__gte=poste.debut_prevu.date())
        ).exists()
        if en_absence:
            raise ValidationError("Le soignant est en absence déclarée/maladie sur cette période.")

        # 6. Heures max hebdos (Somme simplifiée pour l'exemple)
        if contrat_actif.heures_max_hebdo:
            start_week = poste.debut_prevu - datetime.timedelta(days=poste.debut_prevu.weekday())
            end_week = start_week + datetime.timedelta(days=6)
            
            gardes_semaine = Affectation.objects.filter(
                soignant=soignant, statut='VALIDE',
                poste__debut_prevu__gte=start_week,
                poste__debut_prevu__lte=end_week
            )
            total_heures = sum([(g.poste.fin_prevue - g.poste.debut_prevu).total_seconds()/3600.0 for g in gardes_semaine])
            duree_futur_poste = (poste.fin_prevue - poste.debut_prevu).total_seconds() / 3600.0
            
            if (total_heures + duree_futur_poste) > float(contrat_actif.heures_max_hebdo):
                raise ValidationError(f"Plancher d'heures dépassé : Ce poste ferait dépasser les {contrat_actif.heures_max_hebdo}h max hebdos.")
