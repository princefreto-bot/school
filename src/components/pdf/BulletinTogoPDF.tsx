import React from 'react';
import { BulletinEleveResultat } from '../../utils/bulletinCalculations';

interface BulletinTogoPDFProps {
    data: BulletinEleveResultat;
    schoolName: string;
    schoolLogo: string | null;
    schoolStamp?: string | null;
    schoolYear: string;
    studentPhoto?: string | null;
}

// Formatte la date du jour en français
const getDateFr = (): string => {
    const d = new Date();
    const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
};

export const BulletinTogoPDF = React.forwardRef<HTMLDivElement, BulletinTogoPDFProps>(
    ({ data, schoolName, schoolLogo, schoolStamp, schoolYear, studentPhoto }, ref) => {
    return (
        <div
            ref={ref}
            className="bg-white text-black mx-auto relative z-0 flex flex-col justify-between"
            style={{
                width: '210mm',
                height: '297mm',
                padding: '10mm 6mm 4mm 6mm',
                boxSizing: 'border-box',
                fontFamily: '"Times New Roman", Times, serif'
            }}
        >
            {/* FILIGRANE LOGO */}
            {schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.18] pointer-events-none z-[-1]">
                    <img src={schoolLogo} alt="Watermark" className="w-[80%] max-w-3xl object-contain grayscale" />
                </div>
            )}

            <div className="flex-1 flex flex-col">
                {/* ───────────────────────────── EN-TÊTE ENCADRÉ ───────────────────────────── */}
                <div className="border-[2px] border-black rounded-sm mb-2">
                    <div className="flex justify-between items-stretch text-sm px-2 py-1.5">

                        {/* GAUCHE : Sceau carré */}
                        <div className="flex items-center justify-center" style={{ width: '30mm' }}>
                            {schoolStamp ? (
                                <div
                                    className="flex items-center justify-center overflow-hidden"
                                    style={{ width: '30mm', height: '30mm', border: '1.5px solid black' }}
                                >
                                    <img
                                        src={schoolStamp}
                                        alt="Sceau"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col items-center justify-center"
                                    style={{
                                        width: '30mm', height: '30mm',
                                        border: '1.5px dashed #666',
                                        background: '#fafafa'
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-gray-500">SCEAU</span>
                                    <span className="text-[8px] text-gray-400 font-bold text-center leading-tight mt-0.5">DRE-MARITIME</span>
                                </div>
                            )}
                        </div>

                        {/* CENTRE : Textes officiels */}
                        <div className="flex-1 text-center flex flex-col items-center justify-center px-2">
                            <p className="font-bold uppercase text-[9px] tracking-wide mb-0.5">République Togolaise</p>
                            <p className="italic text-[8px] mb-1">Travail – Liberté – Patrie</p>
                            <div className="w-16 border-t border-black mb-1"></div>
                            <h1 className="font-black uppercase text-[13px] leading-tight mb-1">Ministère de l'Éducation Nationale</h1>
                            <h2 className="font-black uppercase tracking-wide text-[11px] leading-tight">{schoolName}</h2>
                            <p className="text-[8.5px] mt-0.5 font-semibold">Tél: +228 90177966 &nbsp;|&nbsp; BP: 80159 Apéssito</p>
                        </div>

                        {/* DROITE : Logo carré (même dimension que sceau) */}
                        <div className="flex items-center justify-center" style={{ width: '30mm' }}>
                            {schoolLogo ? (
                                <div
                                    className="flex items-center justify-center overflow-hidden"
                                    style={{ width: '30mm', height: '30mm', border: '1.5px solid black' }}
                                >
                                    <img
                                        src={schoolLogo}
                                        alt="Logo"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        width: '30mm', height: '30mm',
                                        border: '1.5px dashed #aaa',
                                        background: '#f9f9f9'
                                    }}
                                ></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ──────────────── IDENTIFICATION ÉLÈVE (avec photo passeport) ──────────────── */}
                <div
                    className="border-[1.5px] border-black mb-2"
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}
                >
                    {/* Infos élève — lignes séparées par des bordures */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        {/* Ligne 1 : Nom & Prénom  |  Matricule */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', borderBottom: '1px solid black' }}>
                            <div className="text-[9.5px]" style={{ padding: '3px 6px', borderRight: '1px solid black' }}>
                                <span className="font-bold uppercase">Nom &amp; Prénom(s) : </span>
                                <span>{data.eleve.nom} {data.eleve.prenom}</span>
                            </div>
                            <div className="text-[9.5px]" style={{ padding: '3px 6px' }}>
                                <span className="font-bold uppercase">Matricule : </span>
                                <span>{data.eleve.adsn || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Ligne 2 : Date de naissance  |  Classe */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', borderBottom: '1px solid black' }}>
                            <div className="text-[9.5px]" style={{ padding: '3px 6px', borderRight: '1px solid black' }}>
                                <span className="font-bold uppercase">Date de naissance : </span>
                                <span>{data.eleve.dateNaissance || 'N/A'}</span>
                            </div>
                            <div className="text-[9.5px]" style={{ padding: '3px 6px' }}>
                                <span className="font-bold uppercase">Classe : </span>
                                <span className="font-bold">{data.eleve.classe}</span>
                            </div>
                        </div>

                        {/* Ligne 3 : Sexe  |  Effectif de la classe */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', borderBottom: '1px solid black' }}>
                            <div className="text-[9.5px]" style={{ padding: '3px 6px', borderRight: '1px solid black' }}>
                                <span className="font-bold uppercase">Sexe : </span>
                                <span>{data.eleve.sexe === 'F' ? 'Féminin (F)' : 'Masculin (M)'}</span>
                            </div>
                            <div className="text-[9.5px]" style={{ padding: '3px 6px' }}>
                                <span className="font-bold uppercase">Effectif : </span>
                                <span className="font-bold">{data.effectifClasse} élèves</span>
                            </div>
                        </div>

                        {/* Ligne 4 : TITRE BULLETIN — occupe l'espace vide en face de la photo */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8', borderTop: 'none' }}>
                            <div className="text-center py-1.5 px-3">
                                <p className="font-black uppercase tracking-widest text-[11px] leading-tight">
                                    Bulletin de Notes du {data.periode}
                                </p>
                                <p className="text-[9px] font-semibold text-gray-600 mt-0.5">Année Scolaire : {schoolYear}</p>
                            </div>
                        </div>
                    </div>

                    {/* CADRE PHOTO PASSEPORT — agrandi */}
                    <div
                        className="border-l-[1.5px] border-black flex items-center justify-center flex-shrink-0"
                        style={{ width: '35mm', minHeight: '32mm' }}
                    >
                        {studentPhoto ? (
                            <img
                                src={studentPhoto}
                                alt="Photo élève"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center w-full h-full"
                                style={{ background: '#f0f0f0' }}
                            >
                                <svg viewBox="0 0 60 80" width="44" height="56" xmlns="http://www.w3.org/2000/svg" opacity={0.28}>
                                    <circle cx="30" cy="22" r="16" fill="#555" />
                                    <ellipse cx="30" cy="70" rx="25" ry="20" fill="#555" />
                                </svg>
                                <span className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-widest">PHOTO</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ──────────────── TABLEAU DES NOTES ──────────────── */}
                <table className="w-full border-collapse border-[1.5px] border-black text-[9px]" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '19%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '12%' }} />
                    </colgroup>
                    <thead>
                        <tr className="bg-gray-200 font-bold text-center">
                            <th className="border-[1.5px] border-black p-0.5">MATIÈRES</th>
                            <th className="border-[1.5px] border-black p-0.5">CL.<br/>(/20)</th>
                            <th className="border-[1.5px] border-black p-0.5">DEV.<br/>(/20)</th>
                            <th className="border-[1.5px] border-black p-0.5">COMP.<br/>(/20)</th>
                            <th className="border-[1.5px] border-black p-0.5">MOY.<br/>(/20)</th>
                            <th className="border-[1.5px] border-black p-0.5">COEF</th>
                            <th className="border-[1.5px] border-black p-0.5">CxF</th>
                            <th className="border-[1.5px] border-black p-0.5">RANG</th>
                            <th className="border-[1.5px] border-black p-0.5">PROFESSEUR</th>
                            <th className="border-[1.5px] border-black p-0.5">APPRÉCIATION</th>
                            <th className="border-[1.5px] border-black p-0.5">SIGNATURE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.categories.map((cat) => (
                            <React.Fragment key={cat.categorie}>
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan={11} className="border-[1.5px] border-black p-0.5 pl-1.5 text-[8.5px] uppercase">
                                        {cat.categorie}
                                    </td>
                                </tr>
                                {cat.lignes.map((l, lIndex) => (
                                    <tr key={lIndex} className="text-center">
                                        <td className="border-[1.5px] border-black p-0.5 text-left uppercase font-bold text-[8.5px] leading-tight">{l.matiere.nom}</td>
                                        <td className="border-[1.5px] border-black p-0.5 font-bold">{l.noteClasse !== null ? l.noteClasse : '-'}</td>
                                        <td className="border-[1.5px] border-black p-0.5 font-bold">{l.noteDevoir !== null ? l.noteDevoir : '-'}</td>
                                        <td className="border-[1.5px] border-black p-0.5 font-bold">{l.noteCompo !== null ? l.noteCompo : '-'}</td>
                                        <td className="border-[1.5px] border-black p-0.5 font-black text-[10px] bg-gray-50">{l.moyenneMatiere !== null ? l.moyenneMatiere : '-'}</td>
                                        <td className="border-[1.5px] border-black p-0.5 font-bold">{l.coef}</td>
                                        <td className="border-[1.5px] border-black p-0.5 font-bold bg-gray-50">{l.totalPoints !== null ? l.totalPoints : '-'}</td>
                                        <td className="border-[1.5px] border-black p-0.5 font-bold">{l.rangMatiere}</td>
                                        {/* Colonne PROF : wrapping autorisé, taille réduite pour les longs noms */}
                                        <td
                                            className="border-[1.5px] border-black p-0.5 text-[8px] leading-tight"
                                            style={{ wordBreak: 'break-word', whiteSpace: 'normal', hyphens: 'auto' }}
                                        >
                                            {l.professeur}
                                        </td>
                                        <td className="border-[1.5px] border-black p-0.5 italic font-semibold leading-tight text-[8px]">{l.appreciation}</td>
                                        <td className="border-[1.5px] border-black p-0.5"></td>
                                    </tr>
                                ))}
                                {/* SOUS TOTAL CATÉGORIE */}
                                <tr className="bg-gray-50 font-bold border-black border-t-[1.5px]">
                                    <td colSpan={5} className="border-[1.5px] border-black p-0.5 text-right italic text-[8.5px] font-semibold">
                                        Sous-Total {cat.categorie.split('-')[1]}
                                    </td>
                                    <td className="border-[1.5px] border-black p-0.5 text-center font-bold">{cat.totalCoefs}</td>
                                    <td className="border-[1.5px] border-black p-0.5 text-center font-bold text-rose-700 bg-rose-50">{cat.totalPoints.toFixed(2)}</td>
                                    <td colSpan={4} className="border-[1.5px] border-black p-0.5"></td>
                                </tr>
                            </React.Fragment>
                        ))}
                        {/* TOTAL GÉNÉRAL */}
                        <tr className="font-black bg-gray-200 border-t-[2px] border-black text-[10px]">
                            <td colSpan={5} className="border-[1.5px] border-black p-0.5 text-right uppercase tracking-wider">TOTAL GÉNÉRAL</td>
                            <td className="border-[1.5px] border-black p-0.5 text-center text-blue-900">{data.totalCoefsGeneral}</td>
                            <td className="border-[1.5px] border-black p-0.5 text-center text-rose-900 bg-rose-100">{data.totalPointsGeneral.toFixed(2)}</td>
                            <td colSpan={4} className="border-[1.5px] border-black p-0.5"></td>
                        </tr>
                    </tbody>
                </table>

                {/* RECAP RÉSULTATS */}
                <div className="grid grid-cols-2 gap-3 mt-1.5 text-[9px]">
                    <div className="border-[1.5px] border-black p-1.5 relative overflow-hidden bg-blue-50/20">
                        <table className="w-full font-bold leading-none relative z-10 border-spacing-y-1 border-separate">
                            <tbody>
                                <tr>
                                    <td className="uppercase text-[9px]">Moyenne Générale :</td>
                                    <td className="text-right text-[11px] font-black text-rose-800">
                                        {data.moyenneGenerale.toFixed(2)} <span className="text-[8px]">/ 20</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="uppercase text-[9px]">Rang :</td>
                                    <td className="text-right text-[11px] font-black text-blue-800">
                                        {data.rangGeneral} <span className="text-[8px]">/ {data.effectifClasse}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="border-[1.5px] border-black p-1.5 leading-relaxed space-y-1 font-semibold">
                        <div className="flex justify-between border-b border-gray-400 pb-0.5">
                            <span>Plus forte moyenne :</span>
                            <span className="font-black text-emerald-800">{data.moyenneMax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-400 pb-0.5">
                            <span>Plus faible moyenne :</span>
                            <span className="font-black text-red-800">{data.moyenneMin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Moy. générale de la classe :</span>
                            <span className="font-black text-blue-800">{data.moyenneClasse.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* APPRÉCIATIONS GLOBALES */}
                <div className="border-[1.5px] border-black p-1 text-[9px] mt-1.5 flex items-center justify-between flex-wrap gap-1">
                    <span className="font-bold uppercase tracking-wider text-[8px] mr-1">APPRÉCIATION :</span>
                    {['Très Bien','Bien','Assez-Bien','Passable','Insuffisant','Médiocre'].map(app => (
                        <div key={app} className="flex items-center gap-1">
                            <div className="w-3 h-3 border border-black bg-white flex-shrink-0"></div>
                            <span className="font-bold text-[7.5px] uppercase">{app}</span>
                        </div>
                    ))}
                </div>

                {/* DÉCISIONS & SIGNATURES */}
                <div className="grid grid-cols-2 gap-6 mt-1.5 text-[9px] font-bold text-center">
                    <div className="border-[1.5px] border-black h-16 p-1 relative">
                        <p className="border-b-[1.5px] border-black pb-0.5 mb-1">LE TITULAIRE</p>
                        <p className="italic text-gray-400 font-normal absolute bottom-1 w-full left-0 text-center text-[8px]">Visa ou signature</p>
                    </div>
                    <div className="border-[1.5px] border-black h-16 p-1 relative">
                        <p className="border-b-[1.5px] border-black pb-0.5 mb-1">LE DIRECTEUR / LE PROVISEUR</p>
                        <p className="italic text-gray-400 font-normal absolute bottom-1 w-full left-0 text-center text-[8px]">Sceau et signature</p>
                    </div>
                </div>

                {/* ──────────── PIED DE PAGE ──────────── */}
                <div className="mt-2 flex justify-between items-end">
                    {/* Mention légale */}
                    <p className="text-[7.5px] italic text-gray-400 max-w-[55%]">
                        Ce bulletin est unique et aucune copie ne sera délivrée. À conserver précieusement par le parent ou tuteur.
                    </p>
                    {/* Date de création — plus grande, en bas de page */}
                    <p className="text-[11px] font-bold text-black text-right">
                        Fait à Apessito, le {getDateFr()}
                    </p>
                </div>
            </div>
        </div>
    );
});
