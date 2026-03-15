import React from 'react';
import { BulletinEleveResultat } from '../../utils/bulletinCalculations';

interface BulletinTogoPDFProps {
    data: BulletinEleveResultat;
    schoolName: string;
    schoolLogo: string | null;
    schoolStamp?: string | null;
    schoolYear: string;
}

export const BulletinTogoPDF = React.forwardRef<HTMLDivElement, BulletinTogoPDFProps>(({ data, schoolName, schoolLogo, schoolStamp, schoolYear }, ref) => {
    return (
        <div ref={ref} className="bg-white text-black mx-auto relative z-0" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box', fontFamily: '"Times New Roman", Times, serif' }}>
            {/* WATERMARK LOGO */}
            {schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none z-[-1]">
                    <img src={schoolLogo} alt="Watermark" className="w-[60%] max-w-lg object-contain grayscale" />
                </div>
            )}
            
            {/* EN-TÊTE OFFICIEL TOGOLAIS */}
            <div className="flex justify-between items-center mb-6 text-sm">
                {/* GAUCHE : Logo de l'école agrandi */}
                <div className="w-1/4 flex justify-start">
                    {schoolLogo && <img src={schoolLogo} alt="Logo" className="w-28 h-28 object-contain" />}
                </div>

                {/* CENTRE : Texte regroupé */}
                <div className="w-2/4 text-center flex flex-col items-center">
                    <h2 className="font-black uppercase tracking-wider text-sm">{schoolName}</h2>
                    <p className="text-[11px] mt-1 font-semibold">Tél: +228 XX XX XX</p>
                    <p className="text-[11px] font-semibold mb-2">BP: 123 Tsévié</p>
                    
                    <h3 className="font-bold text-xs">RÉPUBLIQUE TOGOLAISE</h3>
                    <p className="italic text-[10px]">Travail - Liberté - Patrie</p>
                </div>

                {/* DROITE : Sceau de la DRE agrandi */}
                <div className="w-1/4 flex justify-end">
                    {schoolStamp ? (
                        <div className="w-28 h-28 flex justify-center items-center">
                            <img src={schoolStamp} alt="Sceau" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-28 h-28 border-2 border-dashed border-gray-400 rounded-full flex flex-col items-center justify-center p-2">
                            <span className="text-xs font-bold text-gray-400">SCEAU</span>
                            <span className="text-[8px] text-gray-400 mt-1 font-bold text-center">DRE-MARITIME</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center border-y-2 border-black py-2 mb-4">
                <h1 className="text-base font-black uppercase tracking-widest">BULLETIN DE NOTES DU {data.periode}</h1>
                <p className="text-xs font-semibold">Année Scolaire : {schoolYear}</p>
            </div>

            {/* IDENTIFICATION ÉLÈVE */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-4 border-2 border-black p-2 rounded-sm bg-gray-50/50">
                <div className="space-y-1">
                    <p><span className="font-bold uppercase">Nom & Prénom(s) :</span> {data.eleve.nom} {data.eleve.prenom}</p>
                    <p><span className="font-bold uppercase">Date de naissance :</span> {data.eleve.dateNaissance || 'N/A'}</p>
                    <p><span className="font-bold uppercase">Sexe :</span> {data.eleve.sexe}</p>
                </div>
                <div className="space-y-1">
                    <p><span className="font-bold uppercase">Matricule :</span> {data.eleve.adsn || 'N/A'}</p>
                    <p><span className="font-bold uppercase">Classe :</span> {data.eleve.classe}</p>
                    <p><span className="font-bold uppercase">Effectif :</span> <span className="font-bold text-sm">{data.effectifClasse}</span></p>
                </div>
            </div>

            {/* TABLEAU DES NOTES */}
            <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                <thead>
                    <tr className="bg-gray-200 font-bold text-center shadow-[inset_0_0_0_1.5px_black]">
                        <th className="border-[1.5px] border-black p-1.5 w-[22%]">MATIÈRES</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[12%]">PROF.</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[8%]">COEF</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[8%]">CL.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[8%]">DEV.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[8%]">COMP.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[8%] text-[11px]">MOY.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[9%]">CxF</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[8%]">RANG</th>
                        <th className="border-[1.5px] border-black p-1.5 w-[9%]">APPRÉCIATION</th>
                    </tr>
                </thead>
                <tbody>
                    {data.categories.map((cat) => (
                        <React.Fragment key={cat.categorie}>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={10} className="border-[1.5px] border-black p-1.5 pl-2 uppercase">{cat.categorie}</td>
                            </tr>
                            {cat.lignes.map((l, lIndex) => (
                                <tr key={lIndex} className="text-center">
                                    <td className="border-[1.5px] border-black p-1.5 text-left uppercase font-bold text-[9px]">{l.matiere.nom}</td>
                                    <td className="border-[1.5px] border-black p-1.5 text-[8px] truncate max-w-[50px]">{l.professeur}</td>
                                    <td className="border-[1.5px] border-black p-1.5 font-bold text-[11px]">{l.coef}</td>
                                    <td className="border-[1.5px] border-black p-1.5 font-bold text-[11px]">{l.noteClasse !== null ? l.noteClasse : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1.5 font-bold text-[11px]">{l.noteDevoir !== null ? l.noteDevoir : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1.5 font-bold text-[11px]">{l.noteCompo !== null ? l.noteCompo : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1.5 font-black text-[12px] bg-gray-50">{l.moyenneMatiere !== null ? l.moyenneMatiere : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1.5 font-bold text-[11px] bg-gray-50">{l.totalPoints !== null ? l.totalPoints : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1.5 font-bold">{l.rangMatiere}</td>
                                    <td className="border-[1.5px] border-black p-1.5 text-[9px] italic font-semibold">{l.appreciation}</td>
                                </tr>
                            ))}
                            {/* SOUS TOTAL CATEGORIE */}
                            <tr className="bg-gray-50 font-bold border-black border-t-2">
                                <td colSpan={2} className="border-[1.5px] border-black p-1 text-right italic font-semibold">Sous-Total {cat.categorie.split('-')[1]}</td>
                                <td className="border-[1.5px] border-black p-1 text-center font-bold">{cat.totalCoefs}</td>
                                <td colSpan={3} className="border-[1.5px] border-black p-1"></td>
                                <td className="border-[1.5px] border-black p-1 text-center"></td>
                                <td className="border-[1.5px] border-black p-1 text-center font-bold text-rose-700 bg-rose-50">{cat.totalPoints.toFixed(2)}</td>
                                <td colSpan={2} className="border-[1.5px] border-black p-1"></td>
                            </tr>
                        </React.Fragment>
                    ))}
                    {/* TOTAL GENERAL */}
                    <tr className="font-black bg-gray-200 border-t-4 border-black text-[12px] shadow-[inset_0_0_0_1.5px_black]">
                        <td colSpan={2} className="border-[1.5px] border-black p-2 text-right uppercase tracking-wider">TOTAL GÉNÉRAL</td>
                        <td className="border-[1.5px] border-black p-2 text-center text-blue-900">{data.totalCoefsGeneral}</td>
                        <td colSpan={4} className="border-[1.5px] border-black p-2"></td>
                        <td className="border-[1.5px] border-black p-2 text-center text-rose-900 bg-rose-100">{data.totalPointsGeneral.toFixed(2)}</td>
                        <td colSpan={2} className="border-[1.5px] border-black p-2"></td>
                    </tr>
                </tbody>
            </table>

            {/* RECAP RESULTATS */}
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div className="border-[1.5px] border-black p-3 rounded-sm bg-blue-50/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mr-8 -mt-8 opacity-50"></div>
                    <table className="w-full text-sm font-bold leading-none relative z-10 border-spacing-y-2 border-separate">
                        <tbody>
                            <tr>
                                <td className="uppercase">Moyenne Générale :</td>
                                <td className="text-right text-lg font-black text-rose-800">{data.moyenneGenerale.toFixed(2)} <span className="text-sm">/ 20</span></td>
                            </tr>
                            <tr>
                                <td className="uppercase">Rang :</td>
                                <td className="text-right text-lg font-black text-blue-800">{data.rangGeneral} <span className="text-sm">/ {data.effectifClasse}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className="border-[1.5px] border-black p-3 text-sm leading-relaxed space-y-2 rounded-sm font-semibold">
                    <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span>Moyenne du premier :</span>
                        <span className="font-black text-emerald-800">{data.moyenneMax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span>Moyenne du dernier :</span>
                        <span className="font-black text-red-800">{data.moyenneMin.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Moyenne de la classe :</span>
                        <span className="font-black text-blue-800">{data.moyenneClasse.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* DECISIONS & SIGNATURES */}
            <div className="grid grid-cols-2 gap-8 mt-8 text-xs font-bold text-center">
                <div className="border-[1.5px] border-black h-32 p-2 relative rounded-sm">
                    <p className="border-b-[1.5px] border-black pb-1 mb-2">LE TITULAIRE</p>
                    <p className="italic text-gray-500 font-normal absolute bottom-2 w-full text-center">Visa ou signature</p>
                </div>
                <div className="border-[1.5px] border-black h-32 p-2 relative rounded-sm">
                    <p className="border-b-[1.5px] border-black pb-1 mb-2">LE DIRECTEUR / LE PROVISEUR</p>
                    <p className="italic text-gray-500 font-normal absolute bottom-2 w-full text-center">Sceau et signature</p>
                </div>
            </div>

            <p className="text-[8px] italic text-center text-gray-400 mt-8 mb-2">Ce bulletin est unique et aucune copie ne sera délivrée. À conserver précieusement par le parent.</p>
        </div>
    );
});
