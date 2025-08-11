BEGIN;

WITH first_user AS (
  SELECT id
  FROM users
  ORDER BY id ASC
  LIMIT 1
)
INSERT INTO distribution_groups (name, description, created_by)
SELECT g.name, g.description, fu.id
FROM first_user fu
JOIN (
  VALUES
    ('Mitigation Team', 'These are folks in charge of mitigation'),
    ('Information Systems Security Officers', 'ISSOs, ISSMs, ISSRs')
) AS g(name, description)
ON TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM distribution_groups dg WHERE dg.name = g.name
);

COMMIT;
