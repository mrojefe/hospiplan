# Recueil des Requêtes SQL (Q-01 à Q-07)

Ce document correspond au livrable "Requêtage SQL sur feuille blanche" : l'écriture des requêtes en langage SQL avec explication des choix de jointures et d'indexation.

Le dialecte utilisé est **PostgreSQL / SQL Standard**.

## Q-01
> *Lister tous les soignants disponibles (sans absence) pour un créneau donné, possédant toutes les certifications requises par un poste et dont les certifications ne sont pas expirées.*

**Objectif** : Identifier le personnel éligible pour pourvoir un poste de garde précis (par exemple `poste_id = 123`).

```sql
SELECT s.id, s.nom, s.prenom
FROM soignant s
WHERE s.is_actif = TRUE
  -- 1) Exclure les soignants absents sur le créneau du poste (ex: poste 123)
  AND NOT EXISTS (
      SELECT 1 FROM absence a
      JOIN poste_garde pg ON pg.id = 123
      WHERE a.soignant_id = s.id
        -- L'absence chevauche le poste : début absence <= fin poste ET fin absence >= début poste
        AND a.date_debut <= DATE(pg.fin_prevue)
        AND (a.date_fin_reelle IS NULL OR a.date_fin_reelle >= DATE(pg.debut_prevu))
  )
  -- 2) Vérifier la possession DE TOUTES les certifications requises (Division relationnelle)
  AND NOT EXISTS (
      -- Les certifications du poste
      SELECT pcr.certification_id 
      FROM poste_certification_requise pcr 
      WHERE pcr.poste_id = 123
      EXCEPT
      -- Les certifications valides du soignant au moment du poste
      SELECT sc.certification_id 
      FROM soignant_certification sc
      JOIN poste_garde pg ON pg.id = 123
      WHERE sc.soignant_id = s.id
        AND sc.date_obtention <= DATE(pg.debut_prevu)
        AND (sc.date_expiration IS NULL OR sc.date_expiration >= DATE(pg.fin_prevue))
  );
```

**Explication des jointures / choix** :
- Le `NOT EXISTS` est utilisé pour la gestion des exclusions temporelles (les chevauchements d'absence).
- Pour vérifier que le soignant a *toutes* les certifs, nous utilisons une algèbre relationnelle de Division (réalisée via `NOT EXISTS (... EXCEPT ...)`). Si l'ensemble des certifications requises moins celles possédées est vide, alors le soignant est qualifié.
- **Indexation** : Il est vital d'indexer `absence(soignant_id, date_debut, date_fin_reelle)` et `soignant_certification(soignant_id, certification_id)`.


## Q-02
> *Calculer, pour chaque soignant, le nombre d'heures effectives travaillées sur une période donnée en tenant compte de son pourcentage contractuel.*

**Objectif** : Reporting temps de travail effectif (ex: sur le mois de Mars `2024-03-01` à `2024-03-31`).

```sql
SELECT 
    s.id, 
    s.nom, 
    s.prenom,
    SUM(EXTRACT(EPOCH FROM (pg.fin_prevue - pg.debut_prevu))/3600) AS total_heures_brutes,
    c.pourcentage_tps_travail * SUM(EXTRACT(EPOCH FROM (pg.fin_prevue - pg.debut_prevu))/3600) AS heures_ponderees
FROM soignant s
JOIN affectation a ON a.soignant_id = s.id
JOIN poste_garde pg ON a.poste_id = pg.id
-- Jointure temporelle avec le contrat actif au moment de la garde !!
JOIN contrat c ON c.soignant_id = s.id 
    AND c.date_debut <= DATE(pg.debut_prevu) 
    AND (c.date_fin IS NULL OR c.date_fin >= DATE(pg.fin_prevue))
WHERE a.statut = 'VALIDE'
  AND pg.debut_prevu >= '2024-03-01 00:00:00'
  AND pg.fin_prevue <= '2024-03-31 23:59:59'
GROUP BY s.id, s.nom, s.prenom, c.pourcentage_tps_travail;
```

**Explication des jointures / choix** :
- La complication ici consiste à joindre le tableau `contrat` non pas seulement avec le `soignant_id`, mais en s'assurant que le poste eu lieu *pendant* la validité du contrat. Ainsi on évite d'appliquer un pourcentage de 50% si, à l'époque de la garde, le médecin était à 100%.
- `EXTRACT(EPOCH)` permet de convertir des intervalles PostgreSQL facilement en heures.


## Q-03
> *Identifier les postes de garde non couverts dans un service donné sur les 7 prochains jours, en précisant si la non-couverture est due à une absence de personnel ou à un manque de certifications.*

**Objectif** : Alerte manager ; savoir pourquoi un poste (ex: service_id = 1) n'a pas atteint `nb_soignants_min` dans les jours à venir.

```sql
SELECT 
    pg.id AS poste_id,
    pg.debut_prevu,
    pg.nb_soignants_min,
    COUNT(a.id) AS soignants_affectes,
    (pg.nb_soignants_min - COUNT(a.id)) AS soignants_manquants,
    -- Logique simplifiée pour deviner la cause: Si l'on trouve que peu/pas de soignants 
    -- ont la certification active, c'est un problème de certif, sinon c'est un problème d'absence globale.
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM soignant_certification sc 
            WHERE sc.certification_id IN (SELECT certification_id FROM poste_certification_requise pcr WHERE pcr.poste_id = pg.id)
            AND sc.date_expiration IS NULL OR sc.date_expiration >= DATE(pg.debut_prevu)
        ) < pg.nb_soignants_min THEN 'Manque de personnel certifié'
        ELSE 'Indisponibilité / Absences'
    END AS cause_probable
FROM poste_garde pg
JOIN unite_soin us ON pg.unite_id = us.id
LEFT JOIN affectation a ON pg.id = a.poste_id AND a.statut = 'VALIDE'
WHERE us.service_id = 1
  AND pg.debut_prevu BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '7 days'
GROUP BY pg.id, pg.debut_prevu, pg.nb_soignants_min
HAVING COUNT(a.id) < pg.nb_soignants_min;
```

**Explication des jointures / choix** :
- `LEFT JOIN` sur `affectation` pour inclure les postes ayant 0 affectations.
- Clause `HAVING COUNT(a.id) < pg.nb_soignants_min` permet de filtrer uniquement les postes dont la couverture est insuffisante.
- La colonne calculée `cause_probable` fait une sous-requête dans le `CASE` pour tenter de diagnostiquer dynamiquement le problème en estimant le vivier de certifiés.


## Q-04
> *Produire un rapport d'équité de charge par grade et par service sur un mois : nombre moyen de gardes, nombre de nuits, nombre de week-ends — avec écart-type.*

```sql
WITH GardesParSoignant AS (
    SELECT 
        s.id AS soignant_id,
        g.libelle AS grade,
        us.service_id,
        COUNT(a.id) AS nb_gardes,
        SUM(CASE WHEN tg.is_nuit THEN 1 ELSE 0 END) AS nb_nuits,
        SUM(CASE WHEN EXTRACT(ISODOW FROM pg.debut_prevu) IN (6, 7) THEN 1 ELSE 0 END) AS nb_weekends
    FROM soignant s
    JOIN grade g ON s.grade_id = g.id
    JOIN affectation a ON s.id = a.soignant_id AND a.statut = 'VALIDE'
    JOIN poste_garde pg ON a.poste_id = pg.id
    JOIN unite_soin us ON pg.unite_id = us.id
    JOIN type_garde tg ON pg.type_garde_id = tg.id
    WHERE pg.debut_prevu BETWEEN '2024-03-01' AND '2024-03-31'
    GROUP BY s.id, g.libelle, us.service_id
)
SELECT 
    grade,
    service_id,
    AVG(nb_gardes) AS moyenne_gardes,
    STDDEV(nb_gardes) AS ecart_type_gardes,
    AVG(nb_nuits) AS moyenne_nuits,
    AVG(nb_weekends) AS moyenne_weekends
FROM GardesParSoignant
GROUP BY grade, service_id
ORDER BY service_id, grade;
```

**Explication des jointures / choix** :
- Utilisation des **CTE (`WITH`)** pour d'abord agréger les totaux par médecin.
- Ensuite la requête principale calcule la moyenne et l'écart-type (`STDDEV`) de la population pour juger l'équité. Un écart-type élevé indique que la charge est mal distribuée.
- `EXTRACT(ISODOW)` où 6 et 7 correspondent à Samedi et Dimanche.


## Q-05
> *Lister les soignants dont une certification expire dans les 30 prochains jours et qui sont affectés à des postes requérant cette certification.*

```sql
SELECT DISTINCT s.nom, s.prenom, c.libelle AS certif_expirante, sc.date_expiration
FROM soignant s
JOIN soignant_certification sc ON s.id = sc.soignant_id
JOIN certification c ON sc.certification_id = c.id
JOIN affectation a ON s.id = a.soignant_id AND a.statut = 'VALIDE'
JOIN poste_garde pg ON a.poste_id = pg.id
JOIN poste_certification_requise pcr ON pg.id = pcr.poste_id AND pcr.certification_id = c.id
WHERE sc.date_expiration BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '30 days')
  -- Identifier si le poste a lieu après ou autour de l'expiration
  AND DATE(pg.debut_prevu) >= sc.date_expiration;
```


## Q-06
> *Identifier les jours où le taux d'occupation d'un service a dépassé le seuil de sur-activité et lister les affectations actives ces jours-là pour analyse.*

```sql
-- Imaginons que le seuil de sur-activité soit quand le nb_patients dépasse la capacité du service à 90%
WITH JoursSurcharge AS (
    SELECT cp.date_releve, us.service_id, cp.nombre_patients, srv.capacite_lits
    FROM charge_patiente cp
    JOIN unite_soin us ON cp.unite_id = us.id
    JOIN service srv ON us.service_id = srv.id
    WHERE cp.nombre_patients > (srv.capacite_lits * 0.90)
)
SELECT js.date_releve, js.service_id, a.id AS affectation_id, s.nom, s.prenom, pg.debut_prevu
FROM JoursSurcharge js
JOIN unite_soin us ON us.service_id = js.service_id
JOIN poste_garde pg ON pg.unite_id = us.id AND DATE(pg.debut_prevu) = js.date_releve
JOIN affectation a ON pg.id = a.poste_id AND a.statut = 'VALIDE'
JOIN soignant s ON a.soignant_id = s.id
ORDER BY js.date_releve DESC;
```


## Q-07
> *Restituer l'historique complet des prêts inter-services d'un soignant, avec le cumul des heures effectuées hors de son service d'origine sur une période.*

```sql
SELECT 
    ps.soignant_id,
    s.nom, 
    srv_orig.nom AS service_origine,
    srv_dest.nom AS service_emprunteur,
    ps.date_debut,
    ps.date_fin,
    EXTRACT(EPOCH FROM (ps.date_fin - ps.date_debut)) / 3600 AS heures_pretees_sur_le_pret
FROM pret_service ps
JOIN soignant s ON ps.soignant_id = s.id
JOIN service srv_orig ON ps.service_origine_id = srv_orig.id
JOIN service srv_dest ON ps.service_destination_id = srv_dest.id
WHERE ps.soignant_id = 99 -- Exemple
  AND ps.date_debut >= '2024-01-01'
ORDER BY ps.date_debut ASC;

-- Pour le cumul total des heures en dehors de son service d'origine :
SELECT 
    soignant_id,
    SUM(EXTRACT(EPOCH FROM (date_fin - date_debut)) / 3600) AS cumul_heures_pretees
FROM pret_service
WHERE soignant_id = 99
  AND date_debut >= '2024-01-01'
GROUP BY soignant_id;
```
