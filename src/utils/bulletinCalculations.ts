import { Student, Note, ClasseMatiere, Matiere, PeriodeType, MatiereCategorie } from '../types';

export interface MatiereLigneResultat {
    matiere: Matiere;
    professeur: string;
    coef: number;
    noteClasse: number | null;
    noteDevoir: number | null;
    noteCompo: number | null;
    moyenneMatiere: number | null;
    totalPoints: number | null;
    appreciation: string;
    rangMatiere: string; // Ex: 1er, 2ème
}

export interface CategorieResultat {
    categorie: MatiereCategorie;
    lignes: MatiereLigneResultat[];
    totalCoefs: number;
    totalPoints: number;
    moyenneCategorie: number | null;
}

export interface BulletinEleveResultat {
    eleve: Student;
    periode: PeriodeType;
    categories: CategorieResultat[];
    totalCoefsGeneral: number;
    totalPointsGeneral: number;
    moyenneGenerale: number;
    rangGeneral: string;
    effectifClasse: number;
    moyenneClasse: number;
    moyenneMin: number;
    moyenneMax: number;
}

const formatRang = (rank: number): string => {
    if (rank === 1) return '1er';
    return `${rank}ème`;
};

const getAppreciation = (moy: number): string => {
    if (moy >= 18) return 'Excellent';
    if (moy >= 16) return 'Très Bien';
    if (moy >= 14) return 'Bien';
    if (moy >= 12) return 'Assez Bien';
    if (moy >= 10) return 'Passable';
    if (moy >= 8) return 'Insuffisant';
    if (moy >= 5) return 'Médiocre';
    return 'Mauvais';
};

/**
 * Calcule tous les bulletins pour une classe et une période donnée.
 * Permet de déterminer les rangs (Matière & Général).
 */
export const calculerBulletinsClasse = (
    classe: string, 
    periode: PeriodeType,
    students: Student[],
    matieres: Matiere[],
    classeMatieres: ClasseMatiere[],
    notes: Note[]
): BulletinEleveResultat[] => {
    
    const elevesDeLaClasse = students.filter(s => s.classe === classe);
    const configsMatiere = classeMatieres.filter(cm => cm.classe === classe);
    
    // 1. Calcul des moyennes par matière pour chaque élève
    // Structure: [eleveId][matiereId] = moyenne
    const matricesMoyennesMatieres: Record<string, Record<string, number>> = {};
    
    const bulletinsBruts = elevesDeLaClasse.map(eleve => {
        matricesMoyennesMatieres[eleve.id] = {};
        
        let totalCoefsGen = 0;
        let totalPointsGen = 0;

        const categoriesMap = new Map<MatiereCategorie, CategorieResultat>();
        const categoriesOrder: MatiereCategorie[] = ['1-MATIERES LITTERAIRES', '2-MATIERES SCIENTIFIQUES', '3-AUTRES MATIERES'];
        
        categoriesOrder.forEach(cat => categoriesMap.set(cat, {
            categorie: cat,
            lignes: [],
            totalCoefs: 0,
            totalPoints: 0,
            moyenneCategorie: null
        }));

        configsMatiere.forEach(cm => {
            const mat = matieres.find(m => m.id === cm.matiereId);
            if (!mat) return;

            const n = notes.find(x => x.eleveId === eleve.id && x.matiereId === cm.matiereId && x.periode === periode);
            
            const nc = n?.noteClasse ?? null;
            const nd = n?.noteDevoir ?? null;
            const nc_compo = n?.noteCompo ?? null;

            let avgMatiere: number | null = null;
            
            // Logique de calcul Togolaise (Exemple standard: (Interro + Devoir + Compo) / 3 ou similaire)
            // Pour simplifier ici: Si les 3 sont là: (NC + ND + NC_COMPO) / 3
            // S'il manque 1: on divise par 2, etc. (ajustez selon la vraie formule DRE)
            const notesValides = [nc, nd, nc_compo].filter(x => x !== null) as number[];
            if (notesValides.length > 0) {
                avgMatiere = notesValides.reduce((a,b) => a+b, 0) / notesValides.length;
                matricesMoyennesMatieres[eleve.id][mat.id] = avgMatiere;
            }

            let pts: number | null = null;
            if (avgMatiere !== null) {
                pts = avgMatiere * cm.coefficient;
                totalCoefsGen += cm.coefficient;
                totalPointsGen += pts;
            }

            categoriesMap.get(mat.categorie)!.lignes.push({
                matiere: mat,
                professeur: cm.professeur || '',
                coef: cm.coefficient,
                noteClasse: nc,
                noteDevoir: nd,
                noteCompo: nc_compo,
                moyenneMatiere: avgMatiere ? parseFloat(avgMatiere.toFixed(2)) : null,
                totalPoints: pts ? parseFloat(pts.toFixed(2)) : null,
                appreciation: avgMatiere !== null ? getAppreciation(avgMatiere) : '',
                rangMatiere: '' // sera calculé après
            });
        });

        // Calcul des totaux par catégorie
        Array.from(categoriesMap.values()).forEach(cat => {
            cat.lignes.forEach(l => {
                if (l.totalPoints !== null && l.moyenneMatiere !== null) {
                    cat.totalCoefs += l.coef;
                    cat.totalPoints += l.totalPoints;
                }
            });
            if (cat.totalCoefs > 0) {
                cat.moyenneCategorie = parseFloat((cat.totalPoints / cat.totalCoefs).toFixed(2));
            }
        });

        const moyGen = totalCoefsGen > 0 ? (totalPointsGen / totalCoefsGen) : 0;

        return {
            eleve,
            periode,
            categories: Array.from(categoriesMap.values()).filter(c => c.lignes.length > 0),
            totalCoefsGeneral: totalCoefsGen,
            totalPointsGeneral: parseFloat(totalPointsGen.toFixed(2)),
            moyenneGenerale: parseFloat(moyGen.toFixed(2)),
            rangGeneral: '',
            effectifClasse: elevesDeLaClasse.length,
            moyenneClasse: 0,
            moyenneMin: 0,
            moyenneMax: 0
        };
    });

    // --- 2. Détermination des rangs ---
    
    // a. Rangs Généraux
    const sortedByMoyGen = [...bulletinsBruts].sort((a,b) => b.moyenneGenerale - a.moyenneGenerale);
    const moyennesClasses = sortedByMoyGen.map(b => b.moyenneGenerale).filter(m => m > 0);
    const moyenneClasseTotale = moyennesClasses.length > 0 ? moyennesClasses.reduce((a,b)=>a+b, 0) / moyennesClasses.length : 0;
    const moyMin = moyennesClasses.length > 0 ? Math.min(...moyennesClasses) : 0;
    const moyMax = moyennesClasses.length > 0 ? Math.max(...moyennesClasses) : 0;

    sortedByMoyGen.forEach((b, index) => {
        b.rangGeneral = formatRang(index + 1);
        b.moyenneClasse = parseFloat(moyenneClasseTotale.toFixed(2));
        b.moyenneMin = moyMin;
        b.moyenneMax = moyMax;
    });

    // b. Rangs par Matières
    configsMatiere.forEach(cm => {
        const matId = cm.matiereId;
        const eleveScores: { id: string, note: number }[] = [];
        
        Object.keys(matricesMoyennesMatieres).forEach(eId => {
            if (matricesMoyennesMatieres[eId][matId] !== undefined) {
                eleveScores.push({ id: eId, note: matricesMoyennesMatieres[eId][matId] });
            }
        });

        eleveScores.sort((a,b) => b.note - a.note); // décroissant

        eleveScores.forEach((score, rankIndex) => {
            // retrouver le bulletin et injecter le rang
            const b = bulletinsBruts.find(x => x.eleve.id === score.id);
            if (b) {
                b.categories.forEach(cat => {
                    const ligne = cat.lignes.find(l => l.matiere.id === matId);
                    if (ligne) ligne.rangMatiere = formatRang(rankIndex + 1);
                });
            }
        });
    });

    // Retourner les bulletins triés par ordre alphabétique ou mérite. Gardons alphabétique.
    return bulletinsBruts.sort((a,b) => a.eleve.nom.localeCompare(b.eleve.nom));
};
