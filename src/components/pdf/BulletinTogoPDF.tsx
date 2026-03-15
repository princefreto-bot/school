import React from 'react';
import { BulletinEleveResultat } from '../../utils/bulletinCalculations';

interface BulletinTogoPDFProps {
    data: BulletinEleveResultat;
    schoolName: string;
    schoolLogo: string | null;
    schoolYear: string;
}

export const BulletinTogoPDF = React.forwardRef<HTMLDivElement, BulletinTogoPDFProps>(({ data, schoolName, schoolLogo, schoolYear }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black p-8 mx-auto print:p-0" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
            {/* EN-TÊTE OFFICIEL TOGOLAIS */}
            <div className="flex justify-between items-start mb-6 text-sm">
                <div className="text-center">
                    <h2 className="font-bold uppercase tracking-wide text-[10px]">{schoolName}</h2>
                    <p className="text-[10px]">Tél: +228 XX XX XX</p>
                    <p className="text-[10px]">BP: 123 Tsévié</p>
                    {schoolLogo && <img src={schoolLogo} alt="Logo" className="h-16 mt-2 mx-auto grayscale object-contain" />}
                </div>

                <div className="text-center w-32">
                    {/* Placeholder Sceau de l'État - Représenté par un encadré ou logo république si existant */}
                    <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center mx-auto mb-2 relative">
                        <span className="text-[6px] text-gray-400 absolute">SCEAU</span>
                    </div>
                    <p className="font-bold text-[8px] uppercase">DRE-MARITIME</p>
                </div>

                <div className="text-center">
                    <h2 className="font-bold text-xs">RÉPUBLIQUE TOGOLAISE</h2>
                    <p className="italic text-[10px]">Travail - Liberté - Patrie</p>
                </div>
            </div>

            <div className="text-center border-y-2 border-black py-2 mb-4">
                <h1 className="text-base font-black uppercase tracking-widest">BULLETIN DE NOTES DU {data.periode}</h1>
                <p className="text-xs font-semibold">Année Scolaire : {schoolYear}</p>
            </div>

            {/* IDENTIFICATION ÉLÈVE */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-4 border border-black p-2 rounded-sm shadow-sm bg-gray-50/50">
                <div>
                    <p><span className="font-bold">Nom & Prénom(s) :</span> {data.eleve.nom} {data.eleve.prenom}</p>
                    <p><span className="font-bold">Date de naissance :</span> {data.eleve.dateNaissance || 'N/A'}</p>
                    <p><span className="font-bold">Sexe :</span> {data.eleve.sexe}</p>
                </div>
                <div>
                    <p><span className="font-bold">Matricule :</span> {data.eleve.adsn || 'N/A'}</p>
                    <p><span className="font-bold">Classe :</span> {data.eleve.classe}</p>
                    <p><span className="font-bold">Effectif :</span> {data.effectifClasse}</p>
                </div>
            </div>

            {/* TABLEAU DES NOTES */}
            <table className="w-full border-collapse text-[9px]">
                <thead>
                    <tr className="bg-gray-200 font-bold text-center border-black shadow-[inset_0_0_0_1px_black]">
                        <th className="border border-black p-1 w-[22%]">MATIÈRES</th>
                        <th className="border border-black p-1 w-[12%]">PROF.</th>
                        <th className="border border-black p-1 w-[8%]">COEF</th>
                        <th className="border border-black p-1 w-[8%]">CL.<br/>(/20)</th>
                        <th className="border border-black p-1 w-[8%]">DEV.<br/>(/20)</th>
                        <th className="border border-black p-1 w-[8%]">COMP.<br/>(/20)</th>
                        <th className="border border-black p-1 w-[8%]">MOY.<br/>(/20)</th>
                        <th className="border border-black p-1 w-[9%]">CxF</th>
                        <th className="border border-black p-1 w-[8%]">RANG</th>
                        <th className="border border-black p-1 w-[9%]">APPRÉCIATION</th>
                    </tr>
                </thead>
                <tbody>
                    {data.categories.map((cat, catIndex) => (
                        <React.Fragment key={cat.categorie}>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={10} className="border border-black p-1 pl-2 uppercase">{cat.categorie}</td>
                            </tr>
                            {cat.lignes.map((l, lIndex) => (
                                <tr key={lIndex} className="text-center">
                                    <td className="border border-black p-1 text-left uppercase font-semibold">{l.matiere.nom}</td>
                                    <td className="border border-black p-1 text-[8px] truncate max-w-[50px]">{l.professeur}</td>
                                    <td className="border border-black p-1">{l.coef}</td>
                                    <td className="border border-black p-1">{l.noteClasse !== null ? l.noteClasse : '-'}</td>
                                    <td className="border border-black p-1">{l.noteDevoir !== null ? l.noteDevoir : '-'}</td>
                                    <td className="border border-black p-1 font-bold">{l.noteCompo !== null ? l.noteCompo : '-'}</td>
                                    <td className="border border-black p-1 font-bold bg-gray-50">{l.moyenneMatiere !== null ? l.moyenneMatiere : '-'}</td>
                                    <td className="border border-black p-1 bg-gray-50">{l.totalPoints !== null ? l.totalPoints : '-'}</td>
                                    <td className="border border-black p-1 font-semibold">{l.rangMatiere}</td>
                                    <td className="border border-black p-1 text-[8px] italic">{l.appreciation}</td>
                                </tr>
                            ))}
                            {/* SOUS TOTAL CATEGORIE */}
                            <tr className="bg-gray-50 font-bold border-black border-t-2">
                                <td colSpan={2} className="border border-black p-1 text-right italic">Sous-Total {cat.categorie.split('-')[1]}</td>
                                <td className="border border-black p-1 text-center">{cat.totalCoefs}</td>
                                <td colSpan={3} className="border border-black p-1"></td>
                                <td className="border border-black p-1 text-center"></td>
                                <td className="border border-black p-1 text-center text-rose-700 bg-rose-50">{cat.totalPoints.toFixed(2)}</td>
                                <td colSpan={2} className="border border-black p-1"></td>
                            </tr>
                        </React.Fragment>
                    ))}
                    {/* TOTAL GENERAL */}
                    <tr className="font-extrabold bg-gray-200 border-t-4 border-black text-[10px] shadow-[inset_0_0_0_1px_black]">
                        <td colSpan={2} className="border border-black p-2 text-right uppercase tracking-wider">TOTAL GÉNÉRAL</td>
                        <td className="border border-black p-2 text-center text-blue-800">{data.totalCoefsGeneral}</td>
                        <td colSpan={4} className="border border-black p-2"></td>
                        <td className="border border-black p-2 text-center text-rose-800 bg-rose-100">{data.totalPointsGeneral.toFixed(2)}</td>
                        <td colSpan={2} className="border border-black p-2"></td>
                    </tr>
                </tbody>
            </table>

            {/* RECAP RESULTATS */}
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div className="border border-black p-3 rounded bg-blue-50/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mr-8 -mt-8 opacity-50"></div>
                    <table className="w-full text-xs font-bold leading-relaxed relative z-10">
                        <tbody>
                            <tr>
                                <td className="uppercase">Moyenne Générale :</td>
                                <td className="text-right text-base text-rose-700">{data.moyenneGenerale.toFixed(2)} / 20</td>
                            </tr>
                            <tr>
                                <td className="uppercase">Rang :</td>
                                <td className="text-right text-base text-blue-700">{data.rangGeneral} / {data.effectifClasse}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className="border border-black p-3 text-xs leading-relaxed space-y-1">
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span>Moyenne du premier :</span>
                        <span className="font-bold">{data.moyenneMax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span>Moyenne du dernier :</span>
                        <span className="font-bold">{data.moyenneMin.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Moyenne de la classe :</span>
                        <span className="font-bold">{data.moyenneClasse.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* DECISIONS & SIGNATURES */}
            <div className="grid grid-cols-2 gap-8 mt-8 text-xs font-bold text-center">
                <div className="border border-black h-32 p-2 relative">
                    <p className="border-b border-black pb-1 mb-2">LE TITULAIRE</p>
                    <p className="italic text-gray-500 font-normal absolute bottom-2 w-full text-center">Visa ou signature</p>
                </div>
                <div className="border border-black h-32 p-2 relative">
                    <p className="border-b border-black pb-1 mb-2">LE DIRECTEUR / LE PROVISEUR</p>
                    <p className="italic text-gray-500 font-normal absolute bottom-2 w-full text-center">Sceau et signature</p>
                </div>
            </div>

            <p className="text-[8px] italic text-center text-gray-400 mt-8 mb-2">Ce bulletin est unique et aucune copie ne sera délivrée. À conserver précieusement par le parent.</p>
        </div>
    );
});
