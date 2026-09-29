// Version publiée de l'APK Android (public/downloads/dghubschool.apk).
// Doit rester alignée sur versionName dans android/app/build.gradle.
export const APK_DOWNLOAD_URL = '/downloads/dghubschool.apk';
export const APK_VERSION = '1.2.0';
export const APK_SIZE = '~14 Mo';

// 1.2.0 est signée avec une nouvelle clé : Android refuse la mise à jour par-dessus 1.1.0,
// il faut désinstaller l'ancienne application d'abord.
export const APK_REQUIRES_REINSTALL = true;
