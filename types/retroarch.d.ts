declare namespace RetroArch {
    /** Describes the configuration file for: `Retroarch Download Images.js` */
    type ImageConfig = {
        /** Maps input folder names (<KEY> in the -h help) to folder config. */
        folderMap: {
            [ inputFolder: string ]: ImageFolderConfig
        }
    };
    
    /** Configuration object describing a single input/output folder pair. */
    type ImageFolderConfig = {
        /** The output folder name. <OUTPUT> in the -h help. */
        out: string;

        /** ROM case insensitive file suffixes. <EXTENSION> in the -h help. */
        extensions: string[];

        /**
         * Thumbnail images are downloaded by looking in:
         *  https://$ROOT/libretro-thumbnails/$DIR/master/$TYPE/$NAME.png
         *
         * Where:
         *  $ROOT = raw.githubusercontent.com
         *  $DIR  = items from `urls` array, represents the system name(s)
         *  $TYPE = 'Named_Boxarts', 'Named_Snaps', or 'Named_Titles'
         *  $NAME = URL-encoded game name
         *
         * This property provides $DIR values - it represents system name(s).
         * ex: [ "Nintendo_-_Game_Boy", "Nintendo_-_Game_Boy_Color" ]
         */
        urls: string[];
    };

    /** Describes the configuration file for: `Retroarch Make Playlist.js` */
    interface MakePlaylistConfig {
        /**
         * In every string that is copied from this config into the LPL output,
         * keys found in this ObjectMap<string> are replaced by their values.
         *   - Example: `"substitutions": { "%system": "NES" }`
         *   - This would make "games/%system/roms" become "games/NES/roms".
         */
        substitutions: ObjectMap<string>;
        /** One item per LBL playlist JSON file to generate. */
        playlists: PlaylistConfig[];
    }

    /** Describes the configuration for a single playlist. */
    interface PlaylistConfig {
        /** The path (within WD) to ROMs, <folder> in -h. (ex: "SNES") */
        directory: string;
        /** Suffixes of a ROM files, <extensions> in -h. (ex: ["sfc"]) */
        extensions: string[];
        /** Presentable core name, <coreName> in -h. (ex: "Super Nintendo") */
        coreName: string;
        /** Path to the DYLIB. (ex: ":/modules/snes9x_libretro_ios.dylib") */
        corePath: string;
        /**
         * Path to ROM files. Note: "%r" is auto-replaced with each filename.
         * (ex: "~/Documents/RetroArch/downloads/SNES/%r")
         */
        path: string;
        /** An optional list of items to manually add to the playlist. */
        manual?: RetroArch.PlaylistItem[];
    }

    /** Describes an LBL playlist object. */
    interface PlaylistItem {
        /** path to the ROM file (prefix: "~/Documents/RetroArch") */
        path: string;
        /** the name of the game (ex: "Super Mario 64") */
        label: string;
        /** path to the DYLIB (prefix: ":/modules/") */
        core_path: string;
        /** name of the core (ex: "Mupen64Plus") */
        core_name: string;
        /** name of the core (ex: "Mupen64Plus") */
        crc32: string;
        /** the name of this file, ex: "NES.lpl" */
        db_name: string;
    }

    /** Describes an LBL playlist. */
    interface Playlist {
        /** the LBL version, ex: "1.4" */
        version: string;
        /** path to DYLIB file (prefix: ":/modules/") */
        default_core_path: string;
        /** name of the core (ex: "Mupen64Plus") */
        default_core_name: string;
        /** the label display mode (ex: 0) */
        label_display_mode: number;
        /** the right thumbnail mode (ex: 0) */
        right_thumbnail_mode: number;
        /** the left thumbnail mode (ex: 0) */
        left_thumbnail_mode: number;
        /** the method of sorting (ex: 0) */
        sort_mode: number;
        /** the items within this playlist */
        items: PlaylistItem[];
    }

    /** This JSON represents the configuration file to create a VDF with. */
    interface SteamConfig {
        /** Replace each instance of `key` with the corresponding value. */
        substitutions: { [key: string]: string }
        /** A list of ROM sets to create shortcuts for. */
        emulators: SteamShortcutDirectoryConfig[]
    }

    /**
     * A set of ROMs that can be run with the same command.  One shortcut will
     * be created per file in `directory` whose extension matches `extensions`.
     */
    interface SteamShortcutDirectoryConfig {
        /** The directory these ROM files exist within. */
        directory: string;
        /** A list of (case-insensitive) extensions that signify ROM files. */
        extensions: string[];
        /** The binary/executable command to run to execute the rom. */
        exe: string;
        /** CLI arguments for `exe` (note '%r' becomes ROM file names) */
        opts: string;
        /** The directory to run `exe` within. */
        dirExe: string;
        /** Steam tag names to add to each shortcut (for organization). */
        tags: string[];
    }

    /** This JSON, when converted to binary, is written into a VDF file. */
    interface SteamShortcutsVdf {
        /** A list of all the shortcuts that the VDF file represents. */
        shortcuts: SteamShortcut[];
    }

    /** This data represents a single shortcut in a VDF file. */
    interface SteamShortcut {
        /** The user-readable name of the shortcut. */
        AppName: string;
        /** The full path to the exe binary to run the shortcut. */
        exe: string;
        /** The full path to the folder within which to run the exe. */
        StartDir: string;
        /** True if the shortcut is hidden. */
        IsHidden: boolean;
        /** True to allow this shortcut to be configured from the desktop. */
        AllowDesktopConfig: boolean;
        /** True if this shortcut supports OpenVR. */
        OpenVR: boolean;
        /** A list of all steam tags this shortcut is tagged with. */
        tags: string[];
        /** The CLI arguments to run `exe` with when running the shortcut. */
        LaunchOptions: string;
    }

    interface DownloadConfig {
        /** The IP Address of the RetroArch server to download from. */
        ip: string;
        /** The folder path to use as the root of the tree to download. */
        pathRemote: string;
    }

    type FileServerList = FileServerListItem[];

    interface FileServerListItem {
        path: string;
        name: string;
        size?: number;
    }

}
