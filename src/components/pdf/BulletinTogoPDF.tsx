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
        <div ref={ref} className="bg-white text-black mx-auto relative z-0 flex flex-col justify-between" style={{ width: '210mm', height: '297mm', padding: '8mm 15mm', boxSizing: 'border-box', fontFamily: '"Times New Roman", Times, serif' }}>
            {/* WATERMARK LOGO */}
            {schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.20] pointer-events-none z-[-1]">
                    <img src={schoolLogo} alt="Watermark" className="w-[85%] max-w-3xl object-contain grayscale" />
                </div>
            )}
            
            <div className="flex-1">
                {/* EN-TÊTE OFFICIEL TOGOLAIS */}
            <div className="flex justify-between items-center mb-6 text-sm">
                {/* GAUCHE : Sceau de la DRE agrandi */}
                <div className="w-1/4 flex justify-start">
                    {schoolStamp ? (
                        <div className="w-24 h-24 flex justify-center items-center">
                            <img src={schoolStamp} alt="Sceau" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-full flex flex-col items-center justify-center p-2">
                            <span className="text-[10px] font-bold text-gray-400">SCEAU</span>
                            <span className="text-[8px] text-gray-400 mt-1 font-bold text-center">DRE-MARITIME</span>
                        </div>
                    )}
                </div>

                {/* CENTRE : Texte regroupé */}
                <div className="w-2/4 text-center flex flex-col items-center">
                    <h2 className="font-black uppercase tracking-wider text-[13px]">{schoolName}</h2>
                    <p className="text-[10px] mt-1 font-semibold">Tél: +228 90177966</p>
                    <p className="text-[10px] font-semibold mb-1">BP: 80159 Apéssito</p>
                    
                    <h3 className="font-bold text-[11px]">RÉPUBLIQUE TOGOLAISE</h3>
                    <p className="italic text-[9px]">Travail - Liberté - Patrie</p>
                </div>

                {/* DROITE : Logo de l'école agrandi */}
                <div className="w-1/4 flex justify-end">
                    {schoolLogo && <img src={schoolLogo} alt="Logo" className="w-24 h-24 object-contain" />}
                </div>
            </div>

            <div className="text-center border-y-[1.5px] border-black py-0.5 mb-2">
                <h1 className="text-sm font-black uppercase tracking-widest">BULLETIN DE NOTES DU {data.periode}</h1>
                <p className="text-[10px] font-semibold">Année Scolaire : {schoolYear}</p>
            </div>

            {/* IDENTIFICATION ÉLÈVE */}
            <div className="grid grid-cols-2 gap-4 text-[10px] mb-2 border-[1.5px] border-black p-1.5 rounded-sm bg-gray-50/50">
                <div className="space-y-1">
                    <p><span className="font-bold uppercase">Nom & Prénom(s) :</span> {data.eleve.nom} {data.eleve.prenom}</p>
                    <p><span className="font-bold uppercase">Date de naissance :</span> {data.eleve.dateNaissance || 'N/A'}</p>
                    <p><span className="font-bold uppercase">Sexe :</span> {data.eleve.sexe === 'F' ? 'F' : 'M'}</p>
                </div>
                <div className="space-y-1">
                    <p><span className="font-bold uppercase">Matricule :</span> {data.eleve.adsn || 'N/A'}</p>
                    <p><span className="font-bold uppercase">Classe :</span> {data.eleve.classe}</p>
                    <p><span className="font-bold uppercase">Effectif :</span> <span className="font-bold">{data.effectifClasse}</span></p>
                </div>
            </div>

            {/* TABLEAU DES NOTES */}
            <table className="w-full border-collapse border-[1.5px] border-black text-[10px]">
                <thead>
                    <tr className="bg-gray-200 font-bold text-center shadow-[inset_0_0_0_1.5px_black]">
                        <th className="border-[1.5px] border-black p-1 w-[20%]">MATIÈRES</th>
                        <th className="border-[1.5px] border-black p-1 w-[7%]">CL.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1 w-[7%]">DEV.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1 w-[7%]">COMP.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1 w-[8%] text-[10px]">MOY.<br/>(/20)</th>
                        <th className="border-[1.5px] border-black p-1 w-[6%]">COEF</th>
                        <th className="border-[1.5px] border-black p-1 w-[7%]">CxF</th>
                        <th className="border-[1.5px] border-black p-1 w-[6%]">RANG</th>
                        <th className="border-[1.5px] border-black p-1 w-[10%]">PROF.</th>
                        <th className="border-[1.5px] border-black p-1 w-[12%]">APPRÉCIATION</th>
                        <th className="border-[1.5px] border-black p-1 w-[10%]">SIGNATURE</th>
                    </tr>
                </thead>
                <tbody>
                    {data.categories.map((cat) => (
                        <React.Fragment key={cat.categorie}>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={11} className="border-[1.5px] border-black p-1 pl-2 text-[9px] uppercase">{cat.categorie}</td>
                            </tr>
                            {cat.lignes.map((l, lIndex) => (
                                <tr key={lIndex} className="text-center">
                                    <td className="border-[1.5px] border-black p-1 text-left uppercase font-bold text-[10px] leading-tight">{l.matiere.nom}</td>
                                    <td className="border-[1.5px] border-black p-1 font-bold text-[10px]">{l.noteClasse !== null ? l.noteClasse : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1 font-bold text-[10px]">{l.noteDevoir !== null ? l.noteDevoir : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1 font-bold text-[10px]">{l.noteCompo !== null ? l.noteCompo : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1 font-black text-[11px] bg-gray-50">{l.moyenneMatiere !== null ? l.moyenneMatiere : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1 font-bold text-[10px]">{l.coef}</td>
                                    <td className="border-[1.5px] border-black p-1 font-bold text-[10px] bg-gray-50">{l.totalPoints !== null ? l.totalPoints : '-'}</td>
                                    <td className="border-[1.5px] border-black p-1 font-bold text-[10px]">{l.rangMatiere}</td>
                                    <td className="border-[1.5px] border-black p-1 text-[10px] truncate max-w-[50px] leading-tight">{l.professeur}</td>
                                    <td className="border-[1.5px] border-black p-1 text-[10px] italic font-semibold leading-tight">{l.appreciation}</td>
                                    <td className="border-[1.5px] border-black p-1"></td>
                                </tr>
                            ))}
                            {/* SOUS TOTAL CATEGORIE */}
                            <tr className="bg-gray-50 font-bold border-black border-t-[1.5px]">
                                <td colSpan={5} className="border-[1.5px] border-black p-1 text-right italic text-[10px] font-semibold">Sous-Total {cat.categorie.split('-')[1]}</td>
                                <td className="border-[1.5px] border-black p-1 text-center font-bold text-[10px]">{cat.totalCoefs}</td>
                                <td className="border-[1.5px] border-black p-1 text-center font-bold text-[10px] text-rose-700 bg-rose-50">{cat.totalPoints.toFixed(2)}</td>
                                <td colSpan={4} className="border-[1.5px] border-black p-1"></td>
                            </tr>
                        </React.Fragment>
                    ))}
                    {/* TOTAL GENERAL */}
                    <tr className="font-black bg-gray-200 border-t-[2px] border-black text-[11px] shadow-[inset_0_0_0_1.5px_black]">
                        <td colSpan={5} className="border-[1.5px] border-black p-1 text-right uppercase tracking-wider">TOTAL GÉNÉRAL</td>
                        <td className="border-[1.5px] border-black p-1 text-center text-[11px] text-blue-900">{data.totalCoefsGeneral}</td>
                        <td className="border-[1.5px] border-black p-1 text-center text-[11px] text-rose-900 bg-rose-100">{data.totalPointsGeneral.toFixed(2)}</td>
                        <td colSpan={4} className="border-[1.5px] border-black p-1"></td>
                    </tr>
                </tbody>
            </table>

            {/* RECAP RESULTATS */}
            <div className="grid grid-cols-2 gap-4 mt-2 text-[10px]">
                <div className="border-[1.5px] border-black p-1.5 rounded-sm bg-blue-50/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mr-8 -mt-8 opacity-50"></div>
                    <table className="w-full text-[10px] font-bold leading-none relative z-10 border-spacing-y-1 border-separate">
                        <tbody>
                            <tr>
                                <td className="uppercase">Moyenne Générale :</td>
                                <td className="text-right text-[11px] font-black text-rose-800">{data.moyenneGenerale.toFixed(2)} <span className="text-[9px]">/ 20</span></td>
                            </tr>
                            <tr>
                                <td className="uppercase">Rang :</td>
                                <td className="text-right text-[11px] font-black text-blue-800">{data.rangGeneral} <span className="text-[9px]">/ {data.effectifClasse}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className="border-[1.5px] border-black p-2 text-[10px] leading-relaxed space-y-1.5 rounded-sm font-semibold">
                    <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span>Plus forte moyenne :</span>
                        <span className="font-black text-emerald-800">{data.moyenneMax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-400 pb-1">
                        <span>Plus faible moyenne :</span>
                        <span className="font-black text-red-800">{data.moyenneMin.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Moyenne générale de la classe :</span>
                        <span className="font-black text-blue-800">{data.moyenneClasse.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* APPRÉCIATIONS GLOBALES */}
            <div className="border-[1.5px] border-black p-1.5 rounded-sm bg-gray-50/50 text-[10px] mt-2 flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[9px] mr-2">APPRÉCIATION :</span>
                {['Très Bien', 'Bien', 'Assez-Bien', 'Passable', 'Insuffisant', 'Médiocre'].map(app => (
                    <div key={app} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 border-[1px] border-black bg-white"></div>
                        <span className="font-bold text-[8.5px] uppercase">{app}</span>
                    </div>
                ))}
            </div>

            {/* DECISIONS & SIGNATURES */}
            <div className="grid grid-cols-2 gap-8 mt-2 text-[10px] font-bold text-center">
                <div className="border-[1.5px] border-black h-20 p-1.5 relative rounded-sm">
                    <p className="border-b-[1.5px] border-black pb-0.5 mb-1">LE TITULAIRE</p>
                    <p className="italic text-gray-500 font-normal absolute bottom-1 w-full text-center">Visa ou signature</p>
                </div>
                <div className="border-[1.5px] border-black h-20 p-1.5 relative rounded-sm">
                    <p className="border-b-[1.5px] border-black pb-0.5 mb-1">LE DIRECTEUR / LE PROVISEUR</p>
                    <p className="italic text-gray-500 font-normal absolute bottom-1 w-full text-center">Sceau et signature</p>
                </div>
            </div>
            </div>
            
            <p className="text-[8px] italic text-center text-gray-400 mt-2">Ce bulletin est unique et aucune copie ne sera délivrée. À conserver précieusement par le parent.</p>
        </div>
    );
});
