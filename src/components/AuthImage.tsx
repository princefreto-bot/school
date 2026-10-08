import React, { useEffect, useState } from 'react';
import { getAuthHeaders } from '../services/apiHelpers';

type AuthImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string };

// Image servie par une route protégée : téléchargée avec l'en-tête Authorization puis
// affichée depuis la mémoire, pour ne jamais mettre le jeton de session dans l'URL.
export const AuthImage: React.FC<AuthImageProps> = ({ src, onError, ...rest }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    let created: string | null = null;
    setFailed(false);
    fetch(src, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      })
      .catch(() => { if (!revoked) setFailed(true); });
    return () => {
      revoked = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [src]);

  if (failed || !objectUrl) {
    return failed ? null : <div className={rest.className} aria-busy="true" />;
  }
  return <img src={objectUrl} onError={onError} {...rest} />;
};
