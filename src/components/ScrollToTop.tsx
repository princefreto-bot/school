import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Remonte la page en haut à chaque changement de route — sans ça, une
// navigation depuis un lien en bas de page (ex: "Voir plus") atterrit sur
// la nouvelle page à la même position de scroll que la précédente.
export const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
