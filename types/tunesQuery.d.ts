interface TunesQuery {
    resultCount: number;
    results: TunesResult[];
}

interface TunesResult {
    isGameCenterEnabled: string;
    ipadScreenshotUrls: string[];
    appletvScreenshotUrls: string[];
    artworkUrl512: string;
    screenshotUrls: string[];
    artistViewUrl: string;
    artworkUrl60: string;
    artworkUrl100: string;
    supportedDevices: string[];
    kind: string;
    features: string[];
    averageUserRatingForCurrentVersion: number;
    languageCodesISO2A: string[];
    fileSizeBytes: string;
    sellerUrl: string;
    userRatingCountForCurrentVersion: number;
    trackContentRating: string;
    trackCensoredName: string;
    trackViewUrl: string;
    contentAdvisoryRating: string;
    releaseNotes: string;
    minimumOsVersion: string;
    currentVersionReleaseDate: string;
    isVppDeviceBasedLicensingEnabled: boolean;
    trackId: number;
    trackName: string;
    sellerName: string;
    releaseDate: string;
    primaryGenreName: string;
    primaryGenreId: number;
    genreIds: string[];
    currency: string;
    wrapperType: string;
    version: string;
    formattedPrice: string;
    artistId: number;
    artistName: string;
    genres: string[];
    price: number;
    description: string;
    bundleId: string;
    averageUserRating: number;
    userRatingCount: number;
}
