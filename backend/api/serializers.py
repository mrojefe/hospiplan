from rest_framework import serializers
from .models import Soignant, PosteGarde, Affectation, Absence, TypeAbsence, Grade

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'

class SoignantSerializer(serializers.ModelSerializer):
    grade_libelle = serializers.CharField(source='grade.libelle', read_only=True)

    class Meta:
        model = Soignant
        fields = ['id', 'matricule', 'nom', 'prenom', 'email', 'telephone', 'is_actif', 'grade', 'grade_libelle']

class PosteGardeSerializer(serializers.ModelSerializer):
    type_garde_libelle = serializers.CharField(source='type_garde.libelle', read_only=True)
    unite_nom = serializers.CharField(source='unite.nom', read_only=True)

    class Meta:
        model = PosteGarde
        fields = ['id', 'unite', 'unite_nom', 'type_garde', 'type_garde_libelle', 'debut_prevu', 'fin_prevue', 'nb_soignants_min', 'nb_soignants_max']

class AffectationSerializer(serializers.ModelSerializer):
    soignant_nom = serializers.CharField(source='soignant.nom', read_only=True)
    soignant_prenom = serializers.CharField(source='soignant.prenom', read_only=True)
    poste_debut = serializers.DateTimeField(source='poste.debut_prevu', read_only=True)
    poste_fin = serializers.DateTimeField(source='poste.fin_prevue', read_only=True)

    class Meta:
        model = Affectation
        fields = ['id', 'poste', 'soignant', 'statut', 'soignant_nom', 'soignant_prenom', 'poste_debut', 'poste_fin']

class TypeAbsenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeAbsence
        fields = '__all__'

class AbsenceSerializer(serializers.ModelSerializer):
    type_libelle = serializers.CharField(source='type_absence.libelle', read_only=True)

    class Meta:
        model = Absence
        fields = ['id', 'soignant', 'type_absence', 'type_libelle', 'date_debut', 'date_fin_prevue', 'date_fin_reelle']
