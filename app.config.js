require('dotenv/config');

module.exports = {
  expo: {
    name: 'TerraMatch Mobile',
    slug: 'terramatch-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#080d0a',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'org.wri.terramatch.mobile',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'TerraMatch needs your location to track polygon boundaries and collect GPS points.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'TerraMatch needs background location access to track polygon boundaries while walking.',
        NSCameraUsageDescription:
          'TerraMatch needs camera access to capture geotagged photos of restoration sites.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#080d0a',
        foregroundImage: './assets/android-icon-foreground.png',
      },
      package: 'org.wri.terramatch.mobile',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        },
      },
    },
    plugins: [
      'expo-sqlite',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'TerraMatch needs background location to track polygon boundaries while walking.',
          locationWhenInUsePermission:
            'TerraMatch needs your location to track polygon boundaries and collect GPS points.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'TerraMatch needs camera access to capture geotagged photos of restoration sites.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'TerraMatch needs access to your photos to attach images to restoration sites.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '',
      },
    },
  },
};
