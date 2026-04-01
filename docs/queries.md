# Recueil des Requêtes SQL (Q-01 à Q-07) - Schéma Anglais

Ce document correspond au livrable "Requêtage SQL sur feuille blanche" adapté au modèle enseigné (24 tables en anglais).

## Q-01
> *Lister tous les soignants disponibles (sans absence) pour un créneau donné, possédant toutes les certifications requises par un poste et dont les certifications ne sont pas expirées.*

```sql
SELECT s.id, s.first_name, s.last_name
FROM staff s
WHERE s.is_active = TRUE
  -- 1) Exclure les soignants absents sur le créneau du shift 123
  AND NOT EXISTS (
      SELECT 1 FROM absence a
      JOIN shift sh ON sh.id = 123
      WHERE a.staff_id = s.id
        AND a.start_date <= DATE(sh.end_datetime)
        AND (a.actual_end_date IS NULL OR a.actual_end_date >= DATE(sh.start_datetime))
        AND (a.expected_end_date >= DATE(sh.start_datetime))
  )
  -- 2) Vérifier la possession de toutes les certifications requises (Division relationnelle)
  AND NOT EXISTS (
      SELECT src.certification_id 
      FROM shift_required_certification src 
      WHERE src.shift_id = 123
      EXCEPT
      SELECT sc.certification_id 
      FROM staff_certification sc
      JOIN shift sh ON sh.id = 123
      WHERE sc.staff_id = s.id
        AND sc.obtained_date <= DATE(sh.start_datetime)
        AND (sc.expiration_date IS NULL OR sc.expiration_date >= DATE(sh.end_datetime))
  );
```

## Q-02
> *Calculer, pour chaque soignant, le nombre d'heures effectives travaillées sur une période donnée en tenant compte de son pourcentage contractuel.*

```sql
SELECT 
    s.id, s.last_name, s.first_name,
    SUM(EXTRACT(EPOCH FROM (sh.end_datetime - sh.start_datetime))/3600) AS brutes,
    c.workload_percent / 100.0 * SUM(EXTRACT(EPOCH FROM (sh.end_datetime - sh.start_datetime))/3600) AS ponderees
FROM staff s
JOIN shift_assignment sa ON sa.staff_id = s.id
JOIN shift sh ON sa.shift_id = sh.id
JOIN contract c ON c.staff_id = s.id 
    AND c.start_date <= DATE(sh.start_datetime) 
    AND (c.end_date IS NULL OR c.end_date >= DATE(sh.end_datetime))
WHERE sh.start_datetime >= '2024-03-01 00:00:00'
  AND sh.end_datetime <= '2024-03-31 23:59:59'
GROUP BY s.id, s.last_name, s.first_name, c.workload_percent;
```

## Q-03
> *Identifier les postes de garde non couverts dans un service donné sur les 7 prochains jours.*

```sql
SELECT 
    sh.id, sh.start_datetime, sh.min_staff,
    COUNT(sa.id) AS assigned_staff,
    (sh.min_staff - COUNT(sa.id)) AS missing_staff
FROM shift sh
JOIN care_unit cu ON sh.care_unit_id = cu.id
LEFT JOIN shift_assignment sa ON sh.id = sa.shift_id
WHERE cu.service_id = 1
  AND sh.start_datetime BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '7 days')
GROUP BY sh.id, sh.start_datetime, sh.min_staff
HAVING COUNT(sa.id) < sh.min_staff;
```

## Q-04
> *Produire un rapport d'équité de charge.*

```sql
WITH GuardStats AS (
    SELECT 
        s.id AS staff_id, r.name AS role_name, cu.service_id,
        COUNT(sa.id) AS nb_shifts,
        SUM(CASE WHEN st.name ILIKE '%nuit%' THEN 1 ELSE 0 END) AS nb_nights,
        SUM(CASE WHEN EXTRACT(ISODOW FROM sh.start_datetime) IN (6, 7) THEN 1 ELSE 0 END) AS nb_weekends
    FROM staff s
    JOIN staff_role sr ON s.id = sr.staff_id
    JOIN role r ON sr.role_id = r.id
    JOIN shift_assignment sa ON s.id = sa.staff_id
    JOIN shift sh ON sa.shift_id = sh.id
    JOIN care_unit cu ON sh.care_unit_id = cu.id
    JOIN shift_type st ON sh.shift_type_id = st.id
    WHERE sh.start_datetime BETWEEN '2024-03-01' AND '2024-03-31'
    GROUP BY s.id, r.name, cu.service_id
)
SELECT role_name, service_id,
    AVG(nb_shifts) AS avg_shifts, STDDEV(nb_shifts) AS stddev_shifts,
    AVG(nb_nights) AS avg_nights, AVG(nb_weekends) AS avg_weekends
FROM GuardStats GROUP BY role_name, service_id;
```

## Q-05
> *Lister les soignants dont une certification expire dans les 30 prochains jours affectés à un shift lié.*

```sql
SELECT s.last_name, c.name AS certif_name, sc.expiration_date
FROM staff s
JOIN staff_certification sc ON s.id = sc.staff_id
JOIN certification c ON sc.certification_id = c.id
JOIN shift_assignment sa ON s.id = sa.staff_id
JOIN shift sh ON sa.shift_id = sh.id
JOIN shift_required_certification src ON sh.id = src.shift_id AND src.certification_id = c.id
WHERE sc.expiration_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '30 days')
  AND DATE(sh.start_datetime) >= sc.expiration_date;
```

## Q-06
> *Identifier les jours de sur-activité et lister les gardes.*

```sql
WITH OverloadDays AS (
    SELECT pl.date, cu.service_id
    FROM patient_load pl
    JOIN care_unit cu ON pl.care_unit_id = cu.id
    JOIN service srv ON cu.service_id = srv.id
    WHERE pl.patient_count > (srv.bed_capacity * 0.9)
)
SELECT od.date, od.service_id, sa.id, s.last_name
FROM OverloadDays od
JOIN care_unit cu ON cu.service_id = od.service_id
JOIN shift sh ON sh.care_unit_id = cu.id AND DATE(sh.start_datetime) = od.date
JOIN shift_assignment sa ON sh.id = sa.shift_id
JOIN staff s ON sa.staff_id = s.id;
```

## Q-07
> *Historique complet des prêts inter-services.*

```sql
SELECT
    sl.staff_id, s.last_name,
    s_from.name AS from_svc, s_to.name AS to_svc,
    sl.start_date, sl.end_date
FROM staff_loan sl
JOIN staff s ON sl.staff_id = s.id
JOIN service s_from ON sl.from_service_id = s_from.id
JOIN service s_to ON sl.to_service_id = s_to.id
WHERE sl.staff_id = 2;
```
