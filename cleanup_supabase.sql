-- Ce script supprime les doublons en ne gardant qu'une seule ligne par ID d'élève
DELETE FROM students
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM students
    GROUP BY id
);
