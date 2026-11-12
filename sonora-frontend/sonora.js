/**
 * Sonora Music Engine for Arcade Hub
 * Ad-free YouTube player, queue manager, custom playlists, favorites & history.
 */

(function () {
    'use strict';

    // 0. FRAME GUARD: Never allow a second Sonora instance to boot inside #sonora-hub-frame or any iframe
    if (window.self !== window.top) {
        try {
            if (window.top && typeof window.top.handleSonoraRedirect === 'function') {
                window.top.handleSonoraRedirect(window.location.href);
                window.location.replace('about:blank');
                return;
            }
            if (window.top && window.top.document) {
                const parentOverlay = window.top.document.getElementById('sonora-hub-overlay');
                if (parentOverlay) {
                    parentOverlay.setAttribute('hidden', '');
                    const parentFrame = window.top.document.getElementById('sonora-hub-frame');
                    if (parentFrame) parentFrame.src = 'about:blank';
                    return;
                }
            }
            window.top.location.href = window.location.href;
        } catch (e) {
            try { window.top.location.href = window.location.href; } catch (_) {}
        }
        return;
    }

    // Unique Session Instance ID for Single-Player Enforcement across tabs/redirections
    const SONORA_INSTANCE_ID = 'sonora_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    const SESSION_CLAIM_KEY = 'sonora_active_session_lock_v1';
    let sessionChannel = null;
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            sessionChannel = new BroadcastChannel('sonora_single_session_v1');
        }
    } catch (e) {}

    // LocalStorage Keys
    const STORAGE_KEY = 'sonora-youtube-links';
    const ACTIVE_KEY = 'sonora-active-youtube';
    const QUEUE_KEY = 'sonora-youtube-queue';
    const AUDIO_QUEUE_KEY = 'sonora-audio-only-queue';
    const FAVORITES_KEY = 'sonora-favorites';
    const HISTORY_KEY = 'sonora-watch-history';
    const MODE_KEY = 'sonora-player-mode';
    const PLAYLISTS_KEY = 'sonora-custom-playlists';
    const CLEAN_INIT_KEY = 'sonora-clean-init-v2';
    const DEFAULT_SEED_KEY = 'sonora-default-seed-v8';

    const DEFAULT_SONGS = [
        {
            id: 'yt-RWqmC7oBPKA',
            videoId: 'RWqmC7oBPKA',
            category: 'Saloon Song',
            title: 'Saloon Song · Deluxe Pop Saloon | डिलक्स पॉप सैलून: Barber Shop Playlist | Saloon Playlist | Old Songs',
            thumbnail: 'https://i.ytimg.com/vi/RWqmC7oBPKA/hqdefault.jpg'
        },
        {
            id: 'yt-9nx09wvQvNE',
            videoId: '9nx09wvQvNE',
            category: 'Bus Driver Song',
            title: 'Bus Driver Song · Indian Bus Driver Playlist || Hindi Song || 90s Song',
            thumbnail: 'https://i.ytimg.com/vi/9nx09wvQvNE/hqdefault.jpg'
        },
        {
            id: 'yt-YwEKIl3qQzA',
            videoId: 'YwEKIl3qQzA',
            category: 'Road Trip Song',
            title: 'Road Trip Song · Non-Stop Road Trip Jukebox | Best Travelling Songs | Bollywood',
            thumbnail: 'https://i.ytimg.com/vi/YwEKIl3qQzA/hqdefault.jpg'
        },
        {
            id: 'yt-9uS3o5YOR1U',
            videoId: '9uS3o5YOR1U',
            category: '90s Song',
            title: '90s Song · Evergreen Hindi Songs | Bollywood 90s Classics',
            thumbnail: 'https://i.ytimg.com/vi/9uS3o5YOR1U/hqdefault.jpg'
        },
        {
            id: 'yt-BrIkUBI_37I',
            videoId: 'BrIkUBI_37I',
            category: 'Kabhi Yaadon Mein',
            title: 'Kabhi Yaadon Mein Aaun · Abhijeet | Divya Khosla | T-Series Pop Classic',
            thumbnail: 'https://i.ytimg.com/vi/BrIkUBI_37I/hqdefault.jpg'
        },
        {
            id: 'default-wYFZCoQ11jI',
            videoId: 'wYFZCoQ11jI',
            category: 'Hollywood',
            title: 'Hollywood · Top Trending Music on Spotify 2026 🍃 || Best Healing English Songs Playlist',
            thumbnail: 'https://i.ytimg.com/vi/wYFZCoQ11jI/hqdefault.jpg'
        },
        {
            id: 'yt-vgKdf8ktVtU',
            videoId: 'vgKdf8ktVtU',
            category: 'Honey Singh',
            title: 'Honey Singh · Yo Yo Honey Singh Hits & Latest Jukebox',
            thumbnail: 'https://i.ytimg.com/vi/vgKdf8ktVtU/hqdefault.jpg'
        },
        {
            id: 'yt-MlXTbqptX_8',
            videoId: 'MlXTbqptX_8',
            category: 'Satinder Sartaaj',
            title: 'Satinder Sartaaj · Hits & Best Punjabi Sufi Classics',
            thumbnail: 'https://i.ytimg.com/vi/MlXTbqptX_8/hqdefault.jpg'
        },
        {
            id: 'yt-F4zJDtieQtA',
            videoId: 'F4zJDtieQtA',
            category: 'Badshah',
            title: 'Badshah · Best Of Badshah Party Anthems (Proper Patola, Genda Phool, Mercy, Chull)',
            thumbnail: 'https://i.ytimg.com/vi/F4zJDtieQtA/hqdefault.jpg'
        },
        {
            id: 'yt-H4IRWXePhnU',
            videoId: 'H4IRWXePhnU',
            category: 'Karan Aujla',
            title: 'Karan Aujla · All Hits & New Punjabi Songs Collection',
            thumbnail: 'https://i.ytimg.com/vi/H4IRWXePhnU/hqdefault.jpg'
        },
        {
            id: 'yt-wfyJJBoSwio',
            videoId: 'wfyJJBoSwio',
            category: 'Karan Aujla',
            title: 'Karan Aujla · Best Of Karan Aujla Songs Jukebox',
            thumbnail: 'https://i.ytimg.com/vi/wfyJJBoSwio/hqdefault.jpg'
        },
        {
            id: 'yt-5bqOxLuJIq0',
            videoId: '5bqOxLuJIq0',
            category: 'Midnight Vibes',
            title: 'Midnight Vibes 🌙 · Hindi Chill & Emotional Late Night Playlist',
            thumbnail: 'https://i.ytimg.com/vi/5bqOxLuJIq0/hqdefault.jpg'
        }
    ];

    const DEFAULT_CURATED_LIBRARIES = [
        {
            id: 'default-saloon-song',
            name: 'Saloon Song',
            videos: [{ ...DEFAULT_SONGS[0] }]
        },
        {
            id: 'default-bus-driver-song',
            name: 'Bus Driver Song',
            videos: [{ ...DEFAULT_SONGS[1] }]
        },
        {
            id: 'default-road-trip-song',
            name: 'Road Trip Song',
            videos: [{ ...DEFAULT_SONGS[2] }]
        },
        {
            id: 'default-90s-song',
            name: '90s Song',
            videos: [{ ...DEFAULT_SONGS[3] }]
        },
        {
            id: 'default-kabhi-yaadon-mein',
            name: 'Kabhi Yaadon Mein',
            videos: [{ ...DEFAULT_SONGS[4] }]
        },
        {
            id: 'default-hollywood',
            name: 'Hollywood',
            videos: [{ ...DEFAULT_SONGS[5] }]
        },
        {
            id: 'default-mc-square',
            name: 'MC Square',
            videos: []
        },
        {
            id: 'default-honey-singh',
            name: 'Honey Singh',
            videos: [{ ...DEFAULT_SONGS[6] }]
        },
        {
            id: 'default-satinder-sartaaj',
            name: 'Satinder Sartaaj',
            videos: [{ ...DEFAULT_SONGS[7] }]
        },
        {
            id: 'default-badshah',
            name: 'Badshah',
            videos: [{ ...DEFAULT_SONGS[8] }]
        },
        {
        id: "default-karan-aujla",
        name: "Karan Aujla Hits",
        videos: [
                {
                        id: "yt-LK7-_dgAVQE",
                        videoId: "LK7-_dgAVQE",
                        category: "Karan Aujla Hits",
                        title: "Tauba Tauba · Bad Newz | Karan Aujla | Vicky Kaushal",
                        thumbnail: "https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg"
                },
                {
                        id: "yt-cWMxCE2HTag",
                        videoId: "cWMxCE2HTag",
                        category: "Karan Aujla Hits",
                        title: "Softly · Karan Aujla | Ikky | Making Memories",
                        thumbnail: "https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg"
                },
                {
                        id: "yt-wGiaxBbGQk4",
                        videoId: "wGiaxBbGQk4",
                        category: "Karan Aujla Hits",
                        title: "Winning Speech · Karan Aujla | Latest Punjabi Hit",
                        thumbnail: "https://i.ytimg.com/vi/wGiaxBbGQk4/hqdefault.jpg"
                },
                {
                        id: "yt-k85UB5b6pJU",
                        videoId: "k85UB5b6pJU",
                        category: "Karan Aujla Hits",
                        title: "Admirin' You · Karan Aujla | Ikky | Making Memories",
                        thumbnail: "https://i.ytimg.com/vi/k85UB5b6pJU/hqdefault.jpg"
                },
                {
                        id: "yt-BtQp2U6hJII",
                        videoId: "BtQp2U6hJII",
                        category: "Karan Aujla Hits",
                        title: "White Brown Black · Avvy Sra | Karan Aujla | Jaani",
                        thumbnail: "https://i.ytimg.com/vi/BtQp2U6hJII/hqdefault.jpg"
                },
                {
                        id: "yt-4DfVxVeqk2o",
                        videoId: "4DfVxVeqk2o",
                        category: "Karan Aujla Hits",
                        title: "52 Bars · Karan Aujla | Ikky | Four You EP",
                        thumbnail: "https://i.ytimg.com/vi/4DfVxVeqk2o/hqdefault.jpg"
                },
                {
                        id: "yt-fRJ03btNsao",
                        videoId: "fRJ03btNsao",
                        category: "Karan Aujla Hits",
                        title: "Bachke Bachke · Karan Aujla | Ikky | Punjabi Smash Hit",
                        thumbnail: "https://i.ytimg.com/vi/fRJ03btNsao/hqdefault.jpg"
                },
                {
                        id: "yt-rXoReWNm8Zo",
                        videoId: "rXoReWNm8Zo",
                        category: "Karan Aujla Hits",
                        title: "Antidote · Karan Aujla | Making Memories",
                        thumbnail: "https://i.ytimg.com/vi/rXoReWNm8Zo/hqdefault.jpg"
                },
                {
                        id: "yt-CeFQO9MQNqs",
                        videoId: "CeFQO9MQNqs",
                        category: "Karan Aujla Hits",
                        title: "Players · Badshah X Karan Aujla",
                        thumbnail: "https://i.ytimg.com/vi/CeFQO9MQNqs/hqdefault.jpg"
                },
                {
                        id: "yt-au5uNkCKzaY",
                        videoId: "au5uNkCKzaY",
                        category: "Karan Aujla Hits",
                        title: "God Damn · Badshah X Karan Aujla | Ek Tha Raja",
                        thumbnail: "https://i.ytimg.com/vi/au5uNkCKzaY/hqdefault.jpg"
                },
                {
                        id: "yt-2sAzb3kraoQ",
                        videoId: "2sAzb3kraoQ",
                        category: "Karan Aujla Hits",
                        title: "Mexico Koka · Karan Aujla | Mahira Sharma",
                        thumbnail: "https://i.ytimg.com/vi/2sAzb3kraoQ/hqdefault.jpg"
                },
                {
                        id: "yt-o9PY6NsB3_E",
                        videoId: "o9PY6NsB3_E",
                        category: "Karan Aujla Hits",
                        title: "Chitta Kurta · Karan Aujla feat. Gurlez Akhtar",
                        thumbnail: "https://i.ytimg.com/vi/o9PY6NsB3_E/hqdefault.jpg"
                },
                {
                        id: "yt-6Pd-3nvYDRk",
                        videoId: "6Pd-3nvYDRk",
                        category: "Karan Aujla Hits",
                        title: "Don't Look · Karan Aujla | Rupan Bal | Jay Trak",
                        thumbnail: "https://i.ytimg.com/vi/6Pd-3nvYDRk/hqdefault.jpg"
                },
                {
                        id: "yt-H4IRWXePhnU",
                        videoId: "H4IRWXePhnU",
                        category: "Karan Aujla Hits",
                        title: "Karan Aujla · All Hits & New Punjabi Songs Collection",
                        thumbnail: "https://i.ytimg.com/vi/H4IRWXePhnU/hqdefault.jpg"
                },
                {
                        id: "yt-wfyJJBoSwio",
                        videoId: "wfyJJBoSwio",
                        category: "Karan Aujla Hits",
                        title: "Best Of Karan Aujla · Non-Stop Jukebox",
                        thumbnail: "https://i.ytimg.com/vi/wfyJJBoSwio/hqdefault.jpg"
                }
        ]
},
        {
            id: 'default-midnight-vibes',
            name: 'Midnight Vibes',
            videos: [{ ...DEFAULT_SONGS[11] }]
        },
        {
            id: 'default-tmkoc',
            name: '📺 Taarak Mehta (TMKOC)',
            videos: [
                { id: 'yt-1pK_manvlwU', videoId: '1pK_manvlwU', category: 'Taarak Mehta (TMKOC)', title: 'Bhootni Story | FULL EPISODE | Part 1 | Taarak Mehta Ka Ooltah Chashmah | तारक मेहता का उल्टा चश्मा', thumbnail: 'https://i.ytimg.com/vi/1pK_manvlwU/hqdefault.jpg' },
                { id: 'yt-4JtgwW8BTPM', videoId: '4JtgwW8BTPM', category: 'Taarak Mehta (TMKOC)', title: 'Bhootni Story | Full Episode | Part 2 | Taarak Mehta Ka Ooltah Chashmah | तारक मेहता का उल्टा चश्मा', thumbnail: 'https://i.ytimg.com/vi/4JtgwW8BTPM/hqdefault.jpg' },
                { id: 'yt-Ok88oUMS-u0', videoId: 'Ok88oUMS-u0', category: 'Taarak Mehta (TMKOC)', title: 'Taarak Mehta Ka Ooltah Chashmah | Episode 416 (Gokuldham Bhootni Special) | Full Episode', thumbnail: 'https://i.ytimg.com/vi/Ok88oUMS-u0/hqdefault.jpg' },
                { id: 'yt-pFwi2cp1t9Q', videoId: 'pFwi2cp1t9Q', category: 'Taarak Mehta (TMKOC)', title: 'Taarak Mehta Ka Ooltah Chashmah - Episode 417 (Bhootni Arc) - Full Episode', thumbnail: 'https://i.ytimg.com/vi/pFwi2cp1t9Q/hqdefault.jpg' },
                { id: 'yt-U2ACr7SUc7M', videoId: 'U2ACr7SUc7M', category: 'Taarak Mehta (TMKOC)', title: 'Taarak Mehta Ka Ooltah Chashmah - Episode 418 (Bhootni Climax) - Full Episode', thumbnail: 'https://i.ytimg.com/vi/U2ACr7SUc7M/hqdefault.jpg' },
                { id: 'yt-XVDe4ennYbM', videoId: 'XVDe4ennYbM', category: 'Taarak Mehta (TMKOC)', title: 'अंधेरी रात में Jethalal को रोक लिया भूतनी ने | Gokuldham Ki Bhootni | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/XVDe4ennYbM/hqdefault.jpg' },
                { id: 'yt-jzSg_tj_yiY', videoId: 'jzSg_tj_yiY', category: 'Taarak Mehta (TMKOC)', title: 'क्यों डर से काँप रहे हैं Jetha और Bapuji? | Gokuldham Ki Bhootni | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/jzSg_tj_yiY/hqdefault.jpg' },
                { id: 'yt-bmXVRqvZoE8', videoId: 'bmXVRqvZoE8', category: 'Taarak Mehta (TMKOC)', title: 'Water Shortage At Gokuldham! | FULL MOVIE | Fan Favourite | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/bmXVRqvZoE8/hqdefault.jpg' },
                { id: 'yt-YylNVbJUWmE', videoId: 'YylNVbJUWmE', category: 'Taarak Mehta (TMKOC)', title: 'पानी के Force से Bapuji चिपक गए दरवाज़े पर | Water Tanker Comedy | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/YylNVbJUWmE/hqdefault.jpg' },
                { id: 'yt-3iPpeFwD5as', videoId: '3iPpeFwD5as', category: 'Taarak Mehta (TMKOC)', title: 'Jethalal के Guests की वजह से Society में हुई Water Crisis! | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/3iPpeFwD5as/hqdefault.jpg' },
                { id: 'yt-94qbNM_x0vA', videoId: '94qbNM_x0vA', category: 'Taarak Mehta (TMKOC)', title: 'Gokuldham Mein Unknown Tempo?! | FULL MOVIE PART 1 | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/94qbNM_x0vA/hqdefault.jpg' },
                { id: 'yt-0g-0fnbonJc', videoId: '0g-0fnbonJc', category: 'Taarak Mehta (TMKOC)', title: 'Gokuldham Mein Unknown Tempo?! | FULL MOVIE PART 2 | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/0g-0fnbonJc/hqdefault.jpg' },
                { id: 'yt-peKpFzHPp2s', videoId: 'peKpFzHPp2s', category: 'Taarak Mehta (TMKOC)', title: 'Tempo Stuck in Gate - Ep 334 - Taarak Mehta Ka Ooltah Chashmah - Full Episode', thumbnail: 'https://i.ytimg.com/vi/peKpFzHPp2s/hqdefault.jpg' },
                { id: 'yt-Z114q8JQ4wc', videoId: 'Z114q8JQ4wc', category: 'Taarak Mehta (TMKOC)', title: 'Tempo Stuck in Gate - Ep 335 - Taarak Mehta Ka Ooltah Chashmah - Full Episode', thumbnail: 'https://i.ytimg.com/vi/Z114q8JQ4wc/hqdefault.jpg' },
                { id: 'yt-UDbLyCUKLn4', videoId: 'UDbLyCUKLn4', category: 'Taarak Mehta (TMKOC)', title: 'Bhide ki Siti (Whistle Stuck) | Full Movie | Hasa Hasao Divas | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/UDbLyCUKLn4/hqdefault.jpg' },
                { id: 'yt-XCTBOOv-jpk', videoId: 'XCTBOOv-jpk', category: 'Taarak Mehta (TMKOC)', title: 'Bapuji Ki Hichki?! | Full Movie | Taarak Mehta Ka Ooltah Chashmah | तारक मेहता', thumbnail: 'https://i.ytimg.com/vi/XCTBOOv-jpk/hqdefault.jpg' },
                { id: 'yt-6qVEWfCrRWc', videoId: '6qVEWfCrRWc', category: 'Taarak Mehta (TMKOC)', title: 'Gulabo से बचने के लिए Jethalal बना सन्यासी बाबा! | Gulabo Arc | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/6qVEWfCrRWc/hqdefault.jpg' },
                { id: 'yt-5ziEhq6Liyo', videoId: '5ziEhq6Liyo', category: 'Taarak Mehta (TMKOC)', title: 'GOKULDHAM PREMIER LEAGUE (GPL)! | FULL MOVIE | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/5ziEhq6Liyo/hqdefault.jpg' },
                { id: 'yt-pMwY33gov1U', videoId: 'pMwY33gov1U', category: 'Taarak Mehta (TMKOC)', title: 'Ep 1428 - GPL 3 Match | Taarak Mehta Ka Ooltah Chashmah - Full Episode', thumbnail: 'https://i.ytimg.com/vi/pMwY33gov1U/hqdefault.jpg' },
                { id: 'yt-bNF5yt0xHVc', videoId: 'bNF5yt0xHVc', category: 'Taarak Mehta (TMKOC)', title: 'Ep 1429 - GPL 3 Match | Taarak Mehta Ka Ooltah Chashmah - Full Episode', thumbnail: 'https://i.ytimg.com/vi/bNF5yt0xHVc/hqdefault.jpg' },
                { id: 'yt-fpiNLizme9o', videoId: 'fpiNLizme9o', category: 'Taarak Mehta (TMKOC)', title: 'Opposition के लिए क्या है Jetha की Strategy? | GPL Special | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/fpiNLizme9o/hqdefault.jpg' },
                { id: 'yt-i4J1KvFSvqY', videoId: 'i4J1KvFSvqY', category: 'Taarak Mehta (TMKOC)', title: 'Tapu Sena Bhookh Hartal | FULL MOVIE | Ep 616 - 618 | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/i4J1KvFSvqY/hqdefault.jpg' },
                { id: 'yt-ZwDoBTnjij8', videoId: 'ZwDoBTnjij8', category: 'Taarak Mehta (TMKOC)', title: 'Taarak Mehta Ka Ooltah Chashmah - Episode 605 - Full Episode', thumbnail: 'https://i.ytimg.com/vi/ZwDoBTnjij8/hqdefault.jpg' },
                { id: 'yt-HmnG35THPeA', videoId: 'HmnG35THPeA', category: 'Taarak Mehta (TMKOC)', title: 'Taarak Mehta Ka Ooltah Chashmah - Episode 732 - Full Episode', thumbnail: 'https://i.ytimg.com/vi/HmnG35THPeA/hqdefault.jpg' },
                { id: 'yt-m-2aFCLUm-s', videoId: 'm-2aFCLUm-s', category: 'Taarak Mehta (TMKOC)', title: 'Ep 1781 - Flats Ki Renovation | Taarak Mehta Ka Ooltah Chashmah | Full Episode', thumbnail: 'https://i.ytimg.com/vi/m-2aFCLUm-s/hqdefault.jpg' },
                { id: 'yt-p1-mqYx1woM', videoId: 'p1-mqYx1woM', category: 'Taarak Mehta (TMKOC)', title: 'Popatlal Pav Bhaji Khakar Banayega Body! | FULL MOVIE | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/p1-mqYx1woM/hqdefault.jpg' },
                { id: 'yt-NyWsSCahS5w', videoId: 'NyWsSCahS5w', category: 'Taarak Mehta (TMKOC)', title: 'Jetha ने क्यों बांधी आंख पर पट्टी? | Family Dispute | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/NyWsSCahS5w/hqdefault.jpg' },
                { id: 'yt-iae90GAM-kg', videoId: 'iae90GAM-kg', category: 'Taarak Mehta (TMKOC)', title: 'Daya Pe Ayi Nayi Musibat! | FULL MOVIE PART 7 (Ep 1049-1052) | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/iae90GAM-kg/hqdefault.jpg' },
                { id: 'yt-vQpu46k11us', videoId: 'vQpu46k11us', category: 'Taarak Mehta (TMKOC)', title: 'Daya Pe Ayi Nayi Musibat! | FULL MOVIE PART 8 (Ep 1053-1055) | Taarak Mehta Ka Ooltah Chashmah', thumbnail: 'https://i.ytimg.com/vi/vQpu46k11us/hqdefault.jpg' }
            ]
        }
    ];

    // Spotify-Style Curated Audio Collections (Exclusive to Pure Audio Mode — 100% Verified Embeddable & Thumbnail-Validated)
    const AUDIO_CURATED_COLLECTIONS = [
        {
            id: 'audio-trending-now',
            name: '🔥 Trending Now',
            group: 'trending',
            videos: [
                { id: 'yt-roz9sXFkTuE', videoId: 'roz9sXFkTuE', category: 'Trending Audio', title: 'Aaj Ki Raat · Stree 2 | Sachin-Jigar, Madhubanti Bagchi', thumbnail: 'https://i.ytimg.com/vi/roz9sXFkTuE/hqdefault.jpg' },
                { id: 'yt-LK7-_dgAVQE', videoId: 'LK7-_dgAVQE', category: 'Trending Audio', title: 'Tauba Tauba · Bad Newz | Karan Aujla', thumbnail: 'https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg' },
                { id: 'yt-hOHKltAiKXQ', videoId: 'hOHKltAiKXQ', category: 'Trending Audio', title: 'Big Dawgs · Hanumankind | Prod. Kalmi', thumbnail: 'https://i.ytimg.com/vi/hOHKltAiKXQ/hqdefault.jpg' },
                { id: 'yt-iAIBF2ngbWY', videoId: 'iAIBF2ngbWY', category: 'Trending Audio', title: 'Pehle Bhi Main · Animal | Vishal Mishra, Raj Shekhar', thumbnail: 'https://i.ytimg.com/vi/iAIBF2ngbWY/hqdefault.jpg' },
                { id: 'yt-VAdGW7QDJiU', videoId: 'VAdGW7QDJiU', category: 'Trending Audio', title: 'Chaleya · Jawan | Arijit Singh, Shilpa Rao', thumbnail: 'https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg' },
                { id: 'yt-RLzC55ai0eo', videoId: 'RLzC55ai0eo', category: 'Trending Audio', title: 'Heeriye · Jasleen Royal ft. Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg' },
                { id: 'yt-k3ijQJjUbTs', videoId: 'k3ijQJjUbTs', category: 'Trending Audio', title: 'Soulmate · Badshah X Arijit Singh (Ek Tha Raja)', thumbnail: 'https://i.ytimg.com/vi/k3ijQJjUbTs/hqdefault.jpg' },
                { id: 'yt-XTp5jaRU3Ws', videoId: 'XTp5jaRU3Ws', category: 'Trending Audio', title: 'Wavy · Karan Aujla (Official Audio)', thumbnail: 'https://i.ytimg.com/vi/XTp5jaRU3Ws/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-most-viewed',
            name: '🏆 Most Streamed Hits',
            group: 'most-viewed',
            videos: [
                { id: 'yt-BddP6PYo2gs', videoId: 'BddP6PYo2gs', category: 'Most Streamed', title: 'Kesariya · Brahmāstra | Arijit Singh, Pritam', thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg' },
                { id: 'yt-gvyUuxdRdR4', videoId: 'gvyUuxdRdR4', category: 'Most Streamed', title: 'Raataan Lambiyan · Shershaah | Jubin Nautiyal, Asees Kaur', thumbnail: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg' },
                { id: 'yt-Umqb9KENgmk', videoId: 'Umqb9KENgmk', category: 'Most Streamed', title: 'Tum Hi Ho · Aashiqui 2 | Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/Umqb9KENgmk/hqdefault.jpg' },
                { id: 'yt-BBAyRBTfsOU', videoId: 'BBAyRBTfsOU', category: 'Most Streamed', title: 'Vaaste · Dhvani Bhanushali & Nikhil D’Souza', thumbnail: 'https://i.ytimg.com/vi/BBAyRBTfsOU/hqdefault.jpg' },
                { id: 'yt-YxWlaYCA8MU', videoId: 'YxWlaYCA8MU', category: 'Most Streamed', title: 'Jhoome Jo Pathaan · Arijit Singh, Vishal-Sheykhar', thumbnail: 'https://i.ytimg.com/vi/YxWlaYCA8MU/hqdefault.jpg' },
                { id: 'yt-jHNNMj5bNQw', videoId: 'jHNNMj5bNQw', category: 'Most Streamed', title: 'Kabira · Yeh Jawaani Hai Deewani | Pritam', thumbnail: 'https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg' },
                { id: 'yt-JGwWNGJdvx8', videoId: 'JGwWNGJdvx8', category: 'Most Streamed', title: 'Shape of You · Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
                { id: 'yt-kJQP7kiw5Fk', videoId: 'kJQP7kiw5Fk', category: 'Most Streamed', title: 'Despacito · Luis Fonsi ft. Daddy Yankee', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-latest-releases',
            name: '🆕 Latest Releases',
            group: 'latest',
            videos: [
                { id: 'yt-XTp5jaRU3Ws', videoId: 'XTp5jaRU3Ws', category: 'Latest Audio', title: 'Wavy · Karan Aujla (Latest Punjabi Hit)', thumbnail: 'https://i.ytimg.com/vi/XTp5jaRU3Ws/hqdefault.jpg' },
                { id: 'yt-4tywp83zkmk', videoId: '4tywp83zkmk', category: 'Latest Audio', title: 'Cheques · Shubh (Still Rollin)', thumbnail: 'https://i.ytimg.com/vi/4tywp83zkmk/hqdefault.jpg' },
                { id: 'yt-eVli-tstM5E', videoId: 'eVli-tstM5E', category: 'Latest Audio', title: 'Espresso · Sabrina Carpenter', thumbnail: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg' },
                { id: 'yt-G7KNmW9a75Y', videoId: 'G7KNmW9a75Y', category: 'Latest Audio', title: 'Flowers · Miley Cyrus', thumbnail: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg' },
                { id: 'yt-wGiaxBbGQk4', videoId: 'wGiaxBbGQk4', category: 'Latest Audio', title: 'Winning Speech · Karan Aujla & Mxrci', thumbnail: 'https://i.ytimg.com/vi/wGiaxBbGQk4/hqdefault.jpg' },
                { id: 'yt-rXoReWNm8Zo', videoId: 'rXoReWNm8Zo', category: 'Latest Audio', title: 'Antidote · Karan Aujla (Making Memories)', thumbnail: 'https://i.ytimg.com/vi/rXoReWNm8Zo/hqdefault.jpg' },
                { id: 'yt-roz9sXFkTuE', videoId: 'roz9sXFkTuE', category: 'Latest Audio', title: 'Aaj Ki Raat · Stree 2 | Sachin-Jigar', thumbnail: 'https://i.ytimg.com/vi/roz9sXFkTuE/hqdefault.jpg' },
                { id: 'yt-LK7-_dgAVQE', videoId: 'LK7-_dgAVQE', category: 'Latest Audio', title: 'Tauba Tauba · Bad Newz | Karan Aujla', thumbnail: 'https://i.ytimg.com/vi/LK7-_dgAVQE/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-artist-arijit',
            name: '🎤 Arijit Singh Essentials',
            group: 'artists',
            videos: [
                { id: 'yt-BddP6PYo2gs', videoId: 'BddP6PYo2gs', category: 'Arijit Singh', title: 'Kesariya · Brahmāstra | Arijit Singh, Pritam', thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg' },
                { id: 'yt-VAdGW7QDJiU', videoId: 'VAdGW7QDJiU', category: 'Arijit Singh', title: 'Chaleya · Jawan | Arijit Singh, Shilpa Rao', thumbnail: 'https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg' },
                { id: 'yt-RLzC55ai0eo', videoId: 'RLzC55ai0eo', category: 'Arijit Singh', title: 'Heeriye · Jasleen Royal ft. Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg' },
                { id: 'yt-k3ijQJjUbTs', videoId: 'k3ijQJjUbTs', category: 'Arijit Singh', title: 'Soulmate · Badshah X Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/k3ijQJjUbTs/hqdefault.jpg' },
                { id: 'yt-Umqb9KENgmk', videoId: 'Umqb9KENgmk', category: 'Arijit Singh', title: 'Tum Hi Ho · Aashiqui 2 | Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/Umqb9KENgmk/hqdefault.jpg' },
                { id: 'yt-YxWlaYCA8MU', videoId: 'YxWlaYCA8MU', category: 'Arijit Singh', title: 'Jhoome Jo Pathaan · Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/YxWlaYCA8MU/hqdefault.jpg' },
                { id: 'yt-fdubeMFwuGs', videoId: 'fdubeMFwuGs', category: 'Arijit Singh', title: 'Ilahi · Yeh Jawaani Hai Deewani | Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg' },
                { id: 'yt-cYOB941gyXI', videoId: 'cYOB941gyXI', category: 'Arijit Singh', title: 'Hawayein · Jab Harry Met Sejal | Arijit Singh, Pritam', thumbnail: 'https://i.ytimg.com/vi/cYOB941gyXI/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-artist-aujla',
            name: '🎤 Karan Aujla Studio',
            group: 'artists',
            videos: [
                { id: 'yt-cWMxCE2HTag', videoId: 'cWMxCE2HTag', category: 'Karan Aujla', title: 'Softly · Karan Aujla & Ikky (Making Memories)', thumbnail: 'https://i.ytimg.com/vi/cWMxCE2HTag/hqdefault.jpg' },
                { id: 'yt-XTp5jaRU3Ws', videoId: 'XTp5jaRU3Ws', category: 'Karan Aujla', title: 'Wavy · Karan Aujla', thumbnail: 'https://i.ytimg.com/vi/XTp5jaRU3Ws/hqdefault.jpg' },
                { id: 'yt-wGiaxBbGQk4', videoId: 'wGiaxBbGQk4', category: 'Karan Aujla', title: 'Winning Speech · Karan Aujla & Mxrci', thumbnail: 'https://i.ytimg.com/vi/wGiaxBbGQk4/hqdefault.jpg' },
                { id: 'yt-BtQp2U6hJII', videoId: 'BtQp2U6hJII', category: 'Karan Aujla', title: 'White Brown Black · Avvy Sra & Karan Aujla', thumbnail: 'https://i.ytimg.com/vi/BtQp2U6hJII/hqdefault.jpg' },
                { id: 'yt-k85UB5b6pJU', videoId: 'k85UB5b6pJU', category: 'Karan Aujla', title: 'Admirin’ You · Karan Aujla & Ikky', thumbnail: 'https://i.ytimg.com/vi/k85UB5b6pJU/hqdefault.jpg' },
                { id: 'yt-aFWDOFg7X2A', videoId: 'aFWDOFg7X2A', category: 'Karan Aujla', title: 'On Top · Karan Aujla', thumbnail: 'https://i.ytimg.com/vi/aFWDOFg7X2A/hqdefault.jpg' },
                { id: 'yt-4DfVxVeqk2o', videoId: '4DfVxVeqk2o', category: 'Karan Aujla', title: '52 Bars · Karan Aujla & Ikky', thumbnail: 'https://i.ytimg.com/vi/4DfVxVeqk2o/hqdefault.jpg' },
                { id: 'yt-fRJ03btNsao', videoId: 'fRJ03btNsao', category: 'Karan Aujla', title: 'Bachke Bachke · Karan Aujla & Ikky', thumbnail: 'https://i.ytimg.com/vi/fRJ03btNsao/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-artist-punjabi',
            name: '🎤 Diljit & Punjabi Legends',
            group: 'artists',
            videos: [
                { id: 'yt-dCmp56tSSmA', videoId: 'dCmp56tSSmA', category: 'Punjabi Pop', title: 'Born To Shine · Diljit Dosanjh (G.O.A.T)', thumbnail: 'https://i.ytimg.com/vi/dCmp56tSSmA/hqdefault.jpg' },
                { id: 'yt-cl0a3i2wFcc', videoId: 'cl0a3i2wFcc', category: 'Punjabi Pop', title: 'G.O.A.T. · Diljit Dosanjh', thumbnail: 'https://i.ytimg.com/vi/cl0a3i2wFcc/hqdefault.jpg' },
                { id: 'yt-M8vDwlHigJA', videoId: 'M8vDwlHigJA', category: 'Punjabi Pop', title: 'GOAT · Sidhu Moose Wala (Moosetape)', thumbnail: 'https://i.ytimg.com/vi/M8vDwlHigJA/hqdefault.jpg' },
                { id: 'yt-6xoB4ZiKKn0', videoId: '6xoB4ZiKKn0', category: 'Punjabi Pop', title: 'The Last Ride · Sidhu Moose Wala', thumbnail: 'https://i.ytimg.com/vi/6xoB4ZiKKn0/hqdefault.jpg' },
                { id: 'yt-MlXTbqptX_8', videoId: 'MlXTbqptX_8', category: 'Satinder Sartaaj', title: 'Satinder Sartaaj · Sufi Classics & Hits', thumbnail: 'https://i.ytimg.com/vi/MlXTbqptX_8/hqdefault.jpg' },
                { id: 'yt-NbyHNASFi6U', videoId: 'NbyHNASFi6U', category: 'Honey Singh', title: 'Blue Eyes · Yo Yo Honey Singh', thumbnail: 'https://i.ytimg.com/vi/NbyHNASFi6U/hqdefault.jpg' },
                { id: 'yt-PqFMFVcCZgI', videoId: 'PqFMFVcCZgI', category: 'Honey Singh', title: 'Brown Rang · Yo Yo Honey Singh', thumbnail: 'https://i.ytimg.com/vi/PqFMFVcCZgI/hqdefault.jpg' },
                { id: 'yt-NTHz9ephYTw', videoId: 'NTHz9ephYTw', category: 'Badshah', title: 'Kar Gayi Chull · Badshah, Neha Kakkar', thumbnail: 'https://i.ytimg.com/vi/NTHz9ephYTw/hqdefault.jpg' },
                { id: 'yt-8LZgzAZ2lpQ', videoId: '8LZgzAZ2lpQ', category: 'Badshah', title: 'Abhi Toh Party Shuru Hui Hai · Badshah', thumbnail: 'https://i.ytimg.com/vi/8LZgzAZ2lpQ/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-mood-midnight',
            name: '🌙 Midnight Lo-Fi & Chill',
            group: 'moods',
            videos: [
                { id: 'yt-sElE_BfQ67s', videoId: 'sElE_BfQ67s', category: 'Midnight Chill', title: 'Apocalypse · Cigarettes After Sex', thumbnail: 'https://i.ytimg.com/vi/sElE_BfQ67s/hqdefault.jpg' },
                { id: 'yt-vGJTaP6anOU', videoId: 'vGJTaP6anOU', category: 'Midnight Chill', title: 'Can’t Help Falling In Love · Elvis Presley', thumbnail: 'https://i.ytimg.com/vi/vGJTaP6anOU/hqdefault.jpg' },
                { id: 'yt-5bqOxLuJIq0', videoId: '5bqOxLuJIq0', category: 'Midnight Chill', title: 'Midnight Vibes 🌙 · Hindi Chill & Emotional Late Night Mix', thumbnail: 'https://i.ytimg.com/vi/5bqOxLuJIq0/hqdefault.jpg' },
                { id: 'yt-gvyUuxdRdR4', videoId: 'gvyUuxdRdR4', category: 'Midnight Chill', title: 'Raataan Lambiyan · Shershaah', thumbnail: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg' },
                { id: 'yt-iAIBF2ngbWY', videoId: 'iAIBF2ngbWY', category: 'Midnight Chill', title: 'Pehle Bhi Main · Vishal Mishra', thumbnail: 'https://i.ytimg.com/vi/iAIBF2ngbWY/hqdefault.jpg' },
                { id: 'yt-cYOB941gyXI', videoId: 'cYOB941gyXI', category: 'Midnight Chill', title: 'Hawayein · Arijit Singh, Pritam', thumbnail: 'https://i.ytimg.com/vi/cYOB941gyXI/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-mood-roadtrip',
            name: '🚗 Long Drive & Road Trip',
            group: 'moods',
            videos: [
                { id: 'yt-fdubeMFwuGs', videoId: 'fdubeMFwuGs', category: 'Road Trip Audio', title: 'Ilahi · Yeh Jawaani Hai Deewani | Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg' },
                { id: 'yt-jHNNMj5bNQw', videoId: 'jHNNMj5bNQw', category: 'Road Trip Audio', title: 'Kabira · Yeh Jawaani Hai Deewani', thumbnail: 'https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg' },
                { id: 'yt-II2EO3Nw4m0', videoId: 'II2EO3Nw4m0', category: 'Road Trip Audio', title: 'Badtameez Dil · Yeh Jawaani Hai Deewani', thumbnail: 'https://i.ytimg.com/vi/II2EO3Nw4m0/hqdefault.jpg' },
                { id: 'yt-7VppHj0Rue0', videoId: '7VppHj0Rue0', category: 'Road Trip Audio', title: 'Udd Jaa Kaale Kaava · Gadar 2 | Udit Narayan, Alka Yagnik', thumbnail: 'https://i.ytimg.com/vi/7VppHj0Rue0/hqdefault.jpg' },
                { id: 'yt-YwEKIl3qQzA', videoId: 'YwEKIl3qQzA', category: 'Road Trip Audio', title: 'Non-Stop Bollywood Road Trip Audio Jukebox', thumbnail: 'https://i.ytimg.com/vi/YwEKIl3qQzA/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-mood-90s-retro',
            name: '📻 90s Evergreen & Retro',
            group: 'moods',
            videos: [
                { id: 'yt-9uS3o5YOR1U', videoId: '9uS3o5YOR1U', category: '90s Evergreen', title: '90s Evergreen Hindi Classics · Bollywood Golden Hits', thumbnail: 'https://i.ytimg.com/vi/9uS3o5YOR1U/hqdefault.jpg' },
                { id: 'yt-RWqmC7oBPKA', videoId: 'RWqmC7oBPKA', category: '90s Nostalgia', title: 'Deluxe Pop Saloon · Classic 90s Hindi Playlist', thumbnail: 'https://i.ytimg.com/vi/RWqmC7oBPKA/hqdefault.jpg' },
                { id: 'yt-BrIkUBI_37I', videoId: 'BrIkUBI_37I', category: '90s Pop Classic', title: 'Kabhi Yaadon Mein Aaun · Abhijeet | Divya Khosla', thumbnail: 'https://i.ytimg.com/vi/BrIkUBI_37I/hqdefault.jpg' },
                { id: 'yt-xWi8nDUjHGA', videoId: 'xWi8nDUjHGA', category: '90s Remix', title: 'Dil Chori · Yo Yo Honey Singh (Hans Raj Hans Tribute)', thumbnail: 'https://i.ytimg.com/vi/xWi8nDUjHGA/hqdefault.jpg' },
                { id: 'yt-vGJTaP6anOU', videoId: 'vGJTaP6anOU', category: 'Retro Classics', title: 'Can’t Help Falling In Love · Elvis Presley', thumbnail: 'https://i.ytimg.com/vi/vGJTaP6anOU/hqdefault.jpg' }
            ]
        },
        {
            id: 'audio-mood-global-pop',
            name: '🌍 Global English Anthems',
            group: 'moods',
            videos: [
                { id: 'yt-4NRXx6U8ABQ', videoId: '4NRXx6U8ABQ', category: 'Global Pop', title: 'Blinding Lights · The Weeknd', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
                { id: 'yt-kTJczUoc26U', videoId: 'kTJczUoc26U', category: 'Global Pop', title: 'STAY · The Kid LAROI, Justin Bieber', thumbnail: 'https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg' },
                { id: 'yt-YykjpeuMNEk', videoId: 'YykjpeuMNEk', category: 'Global Pop', title: 'Hymn For The Weekend · Coldplay', thumbnail: 'https://i.ytimg.com/vi/YykjpeuMNEk/hqdefault.jpg' },
                { id: 'yt-2LBBaD1aQuw', videoId: '2LBBaD1aQuw', category: 'Global Pop', title: 'Something Just Like This · The Chainsmokers & Coldplay', thumbnail: 'https://i.ytimg.com/vi/2LBBaD1aQuw/hqdefault.jpg' },
                { id: 'yt-RgKAFK5djSk', videoId: 'RgKAFK5djSk', category: 'Global Pop', title: 'See You Again · Wiz Khalifa ft. Charlie Puth', thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg' },
                { id: 'yt-JGwWNGJdvx8', videoId: 'JGwWNGJdvx8', category: 'Global Pop', title: 'Shape of You · Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
                { id: 'yt-eVli-tstM5E', videoId: 'eVli-tstM5E', category: 'Global Pop', title: 'Espresso · Sabrina Carpenter', thumbnail: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg' },
                { id: 'yt-G7KNmW9a75Y', videoId: 'G7KNmW9a75Y', category: 'Global Pop', title: 'Flowers · Miley Cyrus', thumbnail: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg' },
                { id: 'yt-hOHKltAiKXQ', videoId: 'hOHKltAiKXQ', category: 'Global Hip-Hop', title: 'Big Dawgs · Hanumankind', thumbnail: 'https://i.ytimg.com/vi/hOHKltAiKXQ/hqdefault.jpg' }
            ]
        }
    ];

    const FALLBACK_THUMB_SVG =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#2e1065"/><stop offset="100%" stop-color="#0f172a"/>' +
            '</linearGradient></defs>' +
            '<rect width="160" height="90" fill="url(#g)"/>' +
            '<circle cx="80" cy="45" r="22" fill="rgba(139,92,246,0.25)" stroke="#a78bfa" stroke-width="2"/>' +
            '<text x="80" y="52" text-anchor="middle" fill="#f5f3ff" font-family="sans-serif" font-size="22">♫</text>' +
            '</svg>'
        );

    // App State (Starts with the 4 default playlist tracks for everyone)
    const STATE = {
        items: DEFAULT_SONGS.map(s => ({ ...s })), // Default YouTube playlist
        videoQueue: [],         // Active playback queue for Video & Audio Mode
        audioQueue: [],         // Active playback queue for Pure Audio Mode
        get queue() {
            return this.experienceMode === 'audio' ? this.audioQueue : this.videoQueue;
        },
        set queue(val) {
            if (this.experienceMode === 'audio') {
                this.audioQueue = Array.isArray(val) ? val : [];
            } else {
                this.videoQueue = Array.isArray(val) ? val : [];
            }
        },
        favorites: [],          // Array of video IDs
        history: [],            // Watched history
        curatedLibraries: DEFAULT_CURATED_LIBRARIES.map(l => ({ ...l, videos: l.videos.map(v => ({ ...v })) })),
        customPlaylists: [],    // User-created playlists [{ id, name, videos, custom: true }]
        activeLibraryId: 'all-songs',
        activeVideoId: DEFAULT_SONGS[0].videoId,
        activeTrack: { ...DEFAULT_SONGS[0] },
        mode: localStorage.getItem(MODE_KEY) || 'adfree', // 'adfree' | 'official'
        searchTerm: '',
        activeTab: 'library',   // 'library' | 'queue' | 'saved' | 'favorites' | 'history'
        bgPlay: false,
        bgAudio: null,
        isFullscreen: false,
        pickerTrack: null,
        experienceMode: localStorage.getItem('sonora-experience-mode') || 'video', // 'video' | 'audio'
        activeVideoLibraryId: 'all-songs',
        activeAudioLibraryId: 'audio-trending-now',
        activeAudioCategory: 'all',
        isPlaying: false,
        repeatOne: false,
        volume: 100,
        isMuted: false,
        isSeeking: false,
        lastDuration: 0,
        lastPosition: 0
    };

    // DOM Elements Cache
    const DOM = {
        viewport: document.getElementById('sonora-viewport'),
        playerPane: document.querySelector('.player-pane'),
        expModeVideoBtn: document.getElementById('exp-mode-video'),
        expModeAudioBtn: document.getElementById('exp-mode-audio'),
        libraryTabLabel: document.getElementById('library-tab-label'),
        libraryPanelTitle: document.getElementById('library-panel-title'),
        queuePanelTitle: document.getElementById('queue-panel-title'),
        audioCatFilterBar: document.getElementById('audio-collection-filter-bar'),
        audioDeck: document.getElementById('audio-only-deck'),
        audioDeckBackdrop: document.getElementById('audio-deck-backdrop'),
        audioStatusText: document.getElementById('audio-deck-status-text'),
        audioFavBtn: document.getElementById('audio-fav-btn'),
        audioArtworkWrap: document.getElementById('audio-artwork-wrapper'),
        audioArtworkImg: document.getElementById('audio-artwork-img'),
        audioArtworkBadge: document.getElementById('audio-artwork-play-badge'),
        audioTrackTitle: document.getElementById('audio-track-title'),
        audioTrackSub: document.getElementById('audio-track-subtitle'),
        audioSeekSlider: document.getElementById('audio-seek-slider'),
        audioTimeCurrent: document.getElementById('audio-time-current'),
        audioTimeTotal: document.getElementById('audio-time-total'),
        audioShuffleBtn: document.getElementById('audio-shuffle-btn'),
        audioPrevBtn: document.getElementById('audio-prev-btn'),
        audioPlayPauseBtn: document.getElementById('audio-play-pause-btn'),
        audioPlayPauseIcon: document.getElementById('audio-play-pause-icon'),
        audioNextBtn: document.getElementById('audio-next-btn'),
        audioRepeatBtn: document.getElementById('audio-repeat-btn'),
        audioMuteBtn: document.getElementById('audio-mute-btn'),
        audioVolDownBtn: document.getElementById('audio-vol-down-btn'),
        audioVolUpBtn: document.getElementById('audio-vol-up-btn'),
        audioVolSlider: document.getElementById('audio-volume-slider'),
        audioVolLabel: document.getElementById('audio-vol-label'),
        addForm: document.getElementById('add-link-form'),
        addInput: document.getElementById('add-link-input'),
        playerContainer: document.getElementById('player-container'),
        playerStage: document.getElementById('player-stage'),
        fsNowPlaying: document.getElementById('fs-now-playing'),
        fsNextBtn: document.getElementById('fs-next-btn'),
        fsReloadBtn: document.getElementById('fs-reload-btn'),
        fsExitBtn: document.getElementById('fs-exit-btn'),
        nowPlayingTitle: document.getElementById('now-playing-title'),
        nowPlayingSub: document.getElementById('now-playing-sub'),
        modeBtn: document.getElementById('mode-btn'),
        modeBtnLabel: document.getElementById('mode-btn-label'),
        skipBtn: document.getElementById('skip-btn'),
        reloadBtn: document.getElementById('reload-btn'),
        minVideoBtn: document.getElementById('min-video-btn'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        bgPlayBtn: document.getElementById('bg-play-btn'),
        searchForm: document.getElementById('header-search-form'),
        searchInput: document.getElementById('header-search-input'),
        searchClear: document.getElementById('header-search-clear'),
        searchBtn: document.getElementById('header-search-btn'),
        tabs: document.querySelectorAll('.tab-pill'),
        tabPanels: document.querySelectorAll('.tab-panel'),
        // Lists
        libraryList: document.getElementById('library-list'),
        libraryTabs: document.getElementById('library-tabs'),
        suggestedCard: document.getElementById('suggested-card'),
        suggestedList: document.getElementById('suggested-track-list'),
        suggestedBadge: document.getElementById('suggested-badge'),
        toggleAddSongBtn: document.getElementById('toggle-add-song-btn'),
        libraryAddSongForm: document.getElementById('library-add-song-form'),
        libraryAddSongInput: document.getElementById('library-add-song-input'),
        libraryAddSongBtn: document.getElementById('library-add-song-btn'),
        cancelAddSongBtn: document.getElementById('cancel-add-song-btn'),
        queueList: document.getElementById('queue-list'),
        savedList: document.getElementById('saved-list'),
        favoritesList: document.getElementById('favorites-list'),
        historyList: document.getElementById('history-list'),
        // Counts
        libraryCount: document.getElementById('library-count'),
        queueCount: document.getElementById('queue-count'),
        savedCount: document.getElementById('saved-count'),
        favoritesCount: document.getElementById('favorites-count'),
        historyCount: document.getElementById('history-count'),
        // Panel actions
        newPlaylistBtn: document.getElementById('new-playlist-btn'),
        newPlaylistForm: document.getElementById('new-playlist-form'),
        newPlaylistInput: document.getElementById('new-playlist-input'),
        cancelPlaylistBtn: document.getElementById('cancel-playlist-btn'),
        playAllLibraryBtn: document.getElementById('play-all-library-btn'),
        queueAllLibraryBtn: document.getElementById('queue-all-library-btn'),
        clearQueueBtn: document.getElementById('clear-queue-btn'),
        shuffleQueueBtn: document.getElementById('shuffle-queue-btn'),
        exportSavedBtn: document.getElementById('export-saved-btn'),
        importSavedInput: document.getElementById('import-saved-input'),
        // Library Picker Modal
        pickerModal: document.getElementById('library-picker-modal'),
        pickerTitle: document.getElementById('library-picker-title'),
        pickerClose: document.getElementById('library-picker-close'),
        pickerList: document.getElementById('library-picker-list'),
        pickerNewForm: document.getElementById('library-picker-new-form'),
        pickerNewInput: document.getElementById('library-picker-new-input'),
        toast: document.getElementById('sonora-toast')
    };

    // -------------------------------------------------------------------------
    // 1. HELPERS & YOUTUBE URL PARSER
    // -------------------------------------------------------------------------
    function getAllSongsList() {
        const seen = new Set();
        const allSongs = [];

        // 1. Collect songs from all curated library folders
        (STATE.curatedLibraries || []).forEach(lib => {
            (lib.videos || []).forEach(v => {
                if (v && v.videoId && !seen.has(v.videoId)) {
                    seen.add(v.videoId);
                    allSongs.push({ ...v, _libName: lib.name });
                }
            });
        });

        // 2. Collect songs from all user custom library folders
        (STATE.customPlaylists || []).forEach(lib => {
            (lib.videos || []).forEach(v => {
                if (v && v.videoId && !seen.has(v.videoId)) {
                    seen.add(v.videoId);
                    allSongs.push({ ...v, _libName: lib.name });
                }
            });
        });

        // 3. Collect any additional user-saved songs
        (STATE.items || []).forEach(v => {
            if (v && v.videoId && !seen.has(v.videoId)) {
                seen.add(v.videoId);
                allSongs.push(v);
            }
        });

        return allSongs;
    }

    function getAllAudioTracksList() {
        const seen = new Set();
        const allAudio = [];
        AUDIO_CURATED_COLLECTIONS.forEach(col => {
            (col.videos || []).forEach(v => {
                if (v && v.videoId && !seen.has(v.videoId)) {
                    seen.add(v.videoId);
                    allAudio.push({ ...v, _libName: col.name });
                }
            });
        });
        (STATE.customPlaylists || []).forEach(lib => {
            (lib.videos || []).forEach(v => {
                if (v && v.videoId && !seen.has(v.videoId)) {
                    seen.add(v.videoId);
                    allAudio.push({ ...v, _libName: lib.name });
                }
            });
        });
        (STATE.items || []).forEach(v => {
            if (v && v.videoId && !seen.has(v.videoId)) {
                seen.add(v.videoId);
                allAudio.push(v);
            }
        });
        return allAudio;
    }

    function getAllLibraries() {
        if (STATE.experienceMode === 'audio') {
            const cat = STATE.activeAudioCategory || 'all';
            const filteredAudioCols = cat === 'all'
                ? AUDIO_CURATED_COLLECTIONS
                : AUDIO_CURATED_COLLECTIONS.filter(c => c.group === cat);

            if (cat === 'all') {
                const allAudioLib = {
                    id: 'audio-all-tracks',
                    name: '🎧 All Audio Tracks',
                    isAllSongs: true,
                    videos: getAllAudioTracksList()
                };
                return [...filteredAudioCols, ...STATE.customPlaylists, allAudioLib];
            }
            return [...filteredAudioCols, ...STATE.customPlaylists];
        }

        const allSongs = getAllSongsList();
        const allSongsLib = {
            id: 'all-songs',
            name: 'All Songs',
            isAllSongs: true,
            videos: allSongs
        };
        return [allSongsLib, ...STATE.customPlaylists, ...STATE.curatedLibraries];
    }

    function getActiveLibrary() {
        const all = getAllLibraries();
        const found = all.find(l => l.id === STATE.activeLibraryId);
        if (found) return found;
        if (all[0]) {
            STATE.activeLibraryId = all[0].id;
        }
        return all[0];
    }

    function getVideoId(input) {
        if (!input) return '';
        const raw = String(input).trim();

        // Extract URL if user pasted share text like "Check this out https://youtu.be/abc..."
        const urlMatch = raw.match(/https?:\/\/[^\s"'<>]+/i);
        const candidate = urlMatch ? urlMatch[0] : (
            /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|yout-ube\.com)\//i.test(raw)
                ? 'https://' + raw
                : raw
        );

        try {
            const parsed = new URL(candidate);
            const host = parsed.hostname.toLowerCase().replace(/^(?:www|m|music)\./, '');
            let id = '';

            if (host === 'youtu.be') {
                id = parsed.pathname.split('/').filter(Boolean)[0] || '';
            } else if (
                host === 'youtube.com' ||
                host.endsWith('.youtube.com') ||
                host === 'yout-ube.com' ||
                host.endsWith('.yout-ube.com') ||
                host === 'youtube-nocookie.com'
            ) {
                id = parsed.searchParams.get('v') ||
                     parsed.pathname.match(/^\/(?:shorts|embed|live|v|watch)\/([^/?&#]+)/)?.[1] || '';
            }
            if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        } catch {
            // Fall through to regex extraction
        }

        const regexMatch = raw.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/|\/v\/)([a-zA-Z0-9_-]{11})/);
        if (regexMatch && regexMatch[1]) return regexMatch[1];

        return /^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : '';
    }

    function extractAllVideoIds(input) {
        if (!input) return [];
        const raw = String(input).trim();
        const tokens = raw.split(/[\s,;]+/).filter(Boolean);
        const ids = [];
        const seen = new Set();
        tokens.forEach(token => {
            const cleaned = token.replace(/[),.;!?\]}]+$/, '');
            const vid = getVideoId(cleaned);
            if (vid && !seen.has(vid)) {
                seen.add(vid);
                ids.push(vid);
            }
        });
        if (!ids.length) {
            const single = getVideoId(raw);
            if (single) ids.push(single);
        }
        return ids;
    }

    function getPrimaryThumbnail(track) {
        if (track && track.thumbnail && /^https?:\/\//i.test(track.thumbnail)) {
            return track.thumbnail;
        }
        const vid = encodeURIComponent(track.videoId);
        return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    }

    function attachThumbnailFallback(imgEl, videoId) {
        if (!imgEl || !videoId) return;
        const vid = encodeURIComponent(videoId);
        const fallbacks = [
            `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
            `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
            `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
            `https://img.youtube.com/vi/${vid}/0.jpg`,
            `https://i.ytimg.com/vi/${vid}/default.jpg`,
            FALLBACK_THUMB_SVG
        ];
        let step = 0;
        imgEl.addEventListener('error', () => {
            if (step < fallbacks.length) {
                const nextSrc = fallbacks[step++];
                if (nextSrc === FALLBACK_THUMB_SVG) {
                    fetchVideoMeta(videoId).then(meta => {
                        if (!meta) {
                            purgeUnavailableVideo(videoId);
                        }
                    });
                }
                imgEl.src = nextSrc;
            }
        });
    }

    function getPlayerSrc(mode, videoId, startAt = 0) {
        if (!videoId) return '';
        const startParam = startAt > 0 ? `&start=${Math.floor(startAt)}` : '';

        if (mode === 'official') {
            return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1&fs=1&enablejsapi=1${startParam}`;
        }
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3&fs=1&enablejsapi=1${startParam}`;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(msg) {
        if (!DOM.toast) return;
        DOM.toast.textContent = msg;
        DOM.toast.classList.add('show');
        clearTimeout(DOM.toast._timer);
        DOM.toast._timer = setTimeout(() => {
            DOM.toast.classList.remove('show');
        }, 3200);
    }

    let cachedSilentAudioUrl = null;
    function getSilentWavUrl() {
        if (cachedSilentAudioUrl) return cachedSilentAudioUrl;
        const sampleRate = 8000;
        const numSamples = sampleRate * 120; // 2 minutes continuous silent bridge to prevent rapid loop flickering
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);
        const writeStr = (offset, str) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + numSamples * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, numSamples * 2, true);
        cachedSilentAudioUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
        return cachedSilentAudioUrl;
    }

    async function fetchVideoMeta(videoId) {
        const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
        const endpoints = [
            `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
            `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`
        ];
        for (const url of endpoints) {
            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                if (data && data.title) {
                    return {
                        title: String(data.title).trim(),
                        thumbnail: data.thumbnail_url ? String(data.thumbnail_url).trim() : `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
                    };
                }
            } catch {
                // Try next oEmbed endpoint
            }
        }
        return null;
    }

    function hydratePlaceholderTitles() {
        const needsHydration = (item) => {
            if (!item || !item.videoId) return false;
            const title = String(item.title || '').trim();
            if (!title || /^YouTube [Vv]ideo\s*·|^Video\s*\(/i.test(title)) return true;
            if (item.category && title === item.category) return true;
            return false;
        };
        const idsToFetch = new Set();
        const collect = (arr) => {
            (arr || []).forEach(item => {
                if (needsHydration(item)) {
                    idsToFetch.add(item.videoId);
                }
            });
        };
        collect(STATE.items);
        collect(STATE.videoQueue);
        collect(STATE.audioQueue);
        collect(STATE.history);
        STATE.customPlaylists.forEach(p => collect(p.videos));
        STATE.curatedLibraries.forEach(p => collect(p.videos));
        idsToFetch.forEach(videoId => {
            fetchVideoMeta(videoId).then(meta => {
                if (meta) updateTrackMetaEverywhere(videoId, meta);
            });
        });
    }

    function purgeUnavailableVideo(videoId, toastMessage) {
        if (!videoId) return;
        const filterOut = (arr) => Array.isArray(arr) ? arr.filter(v => v && v.videoId !== videoId) : [];
        STATE.items = filterOut(STATE.items);
        STATE.videoQueue = filterOut(STATE.videoQueue);
        STATE.audioQueue = filterOut(STATE.audioQueue);
        STATE.history = filterOut(STATE.history);
        STATE.favorites = (STATE.favorites || []).filter(fid => fid !== videoId);
        STATE.customPlaylists.forEach(p => { p.videos = filterOut(p.videos); });
        STATE.curatedLibraries.forEach(p => { p.videos = filterOut(p.videos); });
        AUDIO_CURATED_COLLECTIONS.forEach(c => { c.videos = filterOut(c.videos); });
        saveState();
        renderAll();
        if (toastMessage) showToast(toastMessage);
    }

    // -------------------------------------------------------------------------
    // 2. PERSISTENCE (IndexedDB + LocalStorage) & INITIALIZATION
    // -------------------------------------------------------------------------
    const IDB_NAME = 'sonora-music-db';
    const IDB_STORE = 'state';
    const IDB_KEY = 'sonora-app-state';

    function openSonoraDB() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('IndexedDB unavailable'));
                return;
            }
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE);
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    function saveToIndexedDB() {
        openSonoraDB().then(db => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const store = tx.objectStore(IDB_STORE);
            store.put({
                items: STATE.items,
                queue: STATE.videoQueue,
                videoQueue: STATE.videoQueue,
                audioQueue: STATE.audioQueue,
                favorites: STATE.favorites,
                history: STATE.history,
                customPlaylists: STATE.customPlaylists,
                activeVideoId: STATE.activeVideoId,
                activeLibraryId: STATE.activeLibraryId,
                mode: STATE.mode,
                updatedAt: Date.now()
            }, IDB_KEY);
        }).catch(() => {});
    }

    function loadFromIndexedDB() {
        return openSonoraDB().then(db => {
            return new Promise((resolve) => {
                const tx = db.transaction(IDB_STORE, 'readonly');
                const store = tx.objectStore(IDB_STORE);
                const getReq = store.get(IDB_KEY);
                getReq.onsuccess = () => resolve(getReq.result || null);
                getReq.onerror = () => resolve(null);
            });
        }).catch(() => null);
    }

    function ensureDefaultPlaylist() {
        const seeded = localStorage.getItem(DEFAULT_SEED_KEY);
        if (!seeded || !Array.isArray(STATE.items) || STATE.items.length === 0) {
            const existingById = new Map((STATE.items || []).map(i => [i.videoId, i]));
            const merged = [];
            DEFAULT_SONGS.forEach(def => {
                const existing = existingById.get(def.videoId);
                if (existing) {
                    existing.category = existing.category || def.category;
                    if (!existing.title || /^YouTube [Vv]ideo/i.test(existing.title)) {
                        existing.title = def.title;
                    }
                    merged.push(existing);
                    existingById.delete(def.videoId);
                } else {
                    merged.push({ ...def });
                }
            });
            existingById.forEach(val => merged.push(val));
            STATE.items = merged;
            try {
                localStorage.setItem(DEFAULT_SEED_KEY, '1');
            } catch {}
            saveState();
        }
        if (!STATE.activeVideoId && STATE.items.length > 0) {
            STATE.activeVideoId = STATE.items[0].videoId;
            STATE.activeTrack = STATE.items[0];
        }
    }

    function loadStorage() {
        try {
            // One-time clean reset so any old pre-loaded / test songs are cleared
            if (!localStorage.getItem(CLEAN_INIT_KEY)) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(ACTIVE_KEY);
                localStorage.removeItem(QUEUE_KEY);
                localStorage.removeItem(AUDIO_QUEUE_KEY);
                localStorage.removeItem(FAVORITES_KEY);
                localStorage.removeItem(HISTORY_KEY);
                localStorage.removeItem(PLAYLISTS_KEY);
                localStorage.setItem(CLEAN_INIT_KEY, '1');
            }
            STATE.items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            STATE.videoQueue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            STATE.audioQueue = JSON.parse(localStorage.getItem(AUDIO_QUEUE_KEY) || '[]');
            STATE.favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
            STATE.history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            STATE.customPlaylists = JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '[]');
            STATE.activeVideoId = localStorage.getItem(ACTIVE_KEY) || '';
        } catch (e) {
            console.warn('[Sonora] Failed to read storage:', e);
        }
        ensureDefaultPlaylist();
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.items));
            localStorage.setItem(QUEUE_KEY, JSON.stringify(STATE.videoQueue));
            localStorage.setItem(AUDIO_QUEUE_KEY, JSON.stringify(STATE.audioQueue));
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(STATE.favorites));
            localStorage.setItem(HISTORY_KEY, JSON.stringify(STATE.history));
            localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(STATE.customPlaylists));
            localStorage.setItem(MODE_KEY, STATE.mode);
            if (STATE.activeVideoId) {
                localStorage.setItem(ACTIVE_KEY, STATE.activeVideoId);
            } else {
                localStorage.removeItem(ACTIVE_KEY);
            }
        } catch (e) {
            console.warn('[Sonora] Failed to save storage:', e);
        }
        saveToIndexedDB();
    }

    async function loadLibraries() {
        try {
            const res = await fetch('sonora-frontend/libraries.json?v=8');
            if (res.ok) {
                const parsed = await res.json();
                STATE.curatedLibraries = Array.isArray(parsed) && parsed.length
                    ? parsed
                    : DEFAULT_CURATED_LIBRARIES.map(l => ({ ...l, videos: l.videos.map(v => ({ ...v })) }));
            }
        } catch (err) {
            STATE.curatedLibraries = DEFAULT_CURATED_LIBRARIES.map(l => ({ ...l, videos: l.videos.map(v => ({ ...v })) }));
        }
        hydratePlaceholderTitles();
        renderAll();
    }

    function syncModeButtonUI() {
        if (!DOM.modeBtn || !DOM.modeBtnLabel) return;
        const isAdFree = STATE.mode !== 'official';
        DOM.modeBtn.classList.toggle('active', isAdFree);
        DOM.modeBtnLabel.textContent = isAdFree ? 'Ad-Free' : 'Embed';
    }

    function syncPlayerIdleState() {
        if (!DOM.playerPane) return;
        const isIdle = !STATE.activeVideoId;
        DOM.playerPane.classList.toggle('is-idle', isIdle);
    }

    // -------------------------------------------------------------------------
    // 3. PLAYBACK & PLAYLIST ENGINE
    // -------------------------------------------------------------------------
    function sendIframeCommand(func, args = []) {
        const iframe = document.getElementById('sonora-active-iframe');
        if (!iframe || !iframe.contentWindow) return;
        try {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func,
                args
            }), '*');
        } catch {}
    }

    function destroyActivePlayerIframe() {
        const existingFrames = document.querySelectorAll('#sonora-active-iframe, #player-stage iframe');
        existingFrames.forEach(f => {
            try {
                if (f.contentWindow) {
                    f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'stopVideo', args: [] }), '*');
                }
                f.src = 'about:blank';
                f.remove();
            } catch (e) {}
        });
    }

    function claimSonoraSession(reason = 'play') {
        const payload = {
            type: 'SONORA_SESSION_CLAIM',
            instanceId: SONORA_INSTANCE_ID,
            reason,
            timestamp: Date.now()
        };
        try {
            if (sessionChannel) sessionChannel.postMessage(payload);
        } catch (e) {}
        try {
            localStorage.setItem(SESSION_CLAIM_KEY, JSON.stringify(payload));
        } catch (e) {}
    }

    function suspendLocalPlayerFromOtherSession() {
        const overlay = document.getElementById('sonora-hub-overlay');
        const hubFrame = document.getElementById('sonora-hub-frame');
        if (overlay) overlay.setAttribute('hidden', '');
        if (hubFrame && hubFrame.src && hubFrame.src !== 'about:blank') {
            try { hubFrame.src = 'about:blank'; } catch (e) {}
        }

        const activeIframe = document.getElementById('sonora-active-iframe');
        if (!activeIframe) return;

        destroyActivePlayerIframe();
        STATE.isPlaying = false;
        if (typeof syncAudioDeckUI === 'function') syncAudioDeckUI();

        if (STATE.bgAudio) {
            try { STATE.bgAudio.pause(); } catch (e) {}
        }
        if ('mediaSession' in navigator) {
            try { navigator.mediaSession.playbackState = 'paused'; } catch (e) {}
        }

        const stage = DOM.playerStage || DOM.playerContainer;
        if (stage && STATE.activeTrack) {
            const track = STATE.activeTrack;
            stage.innerHTML = `
                <button type="button" class="resume-poster" aria-label="Resume last track">
                    <img class="resume-thumb" src="${escapeHtml(getPrimaryThumbnail(track))}" alt="" referrerpolicy="no-referrer">
                    <span class="resume-overlay">▶ <strong>Tap to resume</strong><small>${escapeHtml(track.title)}</small></span>
                </button>`;
            const resumeImg = stage.querySelector('.resume-thumb');
            attachThumbnailFallback(resumeImg, track.videoId);
            stage.querySelector('.resume-poster').addEventListener('click', () => playTrack(track));
            if (DOM.nowPlayingSub) {
                DOM.nowPlayingSub.textContent = 'Paused · tap the player to resume';
            }
        }
    }

    if (sessionChannel) {
        sessionChannel.addEventListener('message', (e) => {
            const data = e && e.data;
            if (data && data.type === 'SONORA_SESSION_CLAIM' && data.instanceId && data.instanceId !== SONORA_INSTANCE_ID) {
                suspendLocalPlayerFromOtherSession();
            }
        });
    }

    window.addEventListener('storage', (e) => {
        if (e.key === SESSION_CLAIM_KEY && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data && data.instanceId && data.instanceId !== SONORA_INSTANCE_ID) {
                    suspendLocalPlayerFromOtherSession();
                }
            } catch (err) {}
        }
    });

    function playTrack(track) {
        if (!track || !track.videoId) return;

        // Enforce single active player across all tabs/sessions and destroy any prior player on this page
        claimSonoraSession('play');
        destroyActivePlayerIframe();

        STATE.activeVideoId = track.videoId;
        STATE.activeTrack = track;
        if (DOM.playerPane) {
            DOM.playerPane.classList.remove('is-idle', 'is-video-minimized');
        }
        if (DOM.minVideoBtn) {
            DOM.minVideoBtn.classList.remove('active');
            DOM.minVideoBtn.innerHTML = '🗗 <span>Mini</span>';
        }
        saveState();

        // Add to history
        const existingIdx = STATE.history.findIndex(h => h.videoId === track.videoId);
        if (existingIdx > -1) STATE.history.splice(existingIdx, 1);
        STATE.history.unshift({
            ...track,
            playedAt: Date.now()
        });
        if (STATE.history.length > 50) STATE.history.pop();
        saveState();

        if (track && track.videoId) {
            try {
                if (DOM.playerPane && DOM.playerPane.classList.contains('is-video-minimized')) {
                    localStorage.setItem('sonora_mini_active', 'true');
                }
                localStorage.setItem('sonora_active_track', JSON.stringify(track));
                localStorage.setItem('sonora_active_video_id', track.videoId);
            } catch {}
        }

        // Render iframe into stage (sandboxed to prevent opening external tabs or leaving Sonora)
        const src = getPlayerSrc(STATE.mode, track.videoId);
        const stage = DOM.playerStage || DOM.playerContainer;
        stage.innerHTML = `
            <iframe
                id="sonora-active-iframe"
                src="${src}"
                title="${escapeHtml(track.title || 'Sonora Player')}"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowfullscreen
                webkitallowfullscreen
                mozallowfullscreen
                referrerpolicy="strict-origin-when-cross-origin">
            </iframe>
        `;

        STATE.isPlaying = true;
        STATE.lastPosition = 0;
        STATE.lastDuration = 0;

        const mountedIframe = document.getElementById('sonora-active-iframe');
        if (mountedIframe) {
            const registerTelemetry = () => {
                try {
                    if (mountedIframe.contentWindow) {
                        mountedIframe.contentWindow.postMessage(JSON.stringify({
                            event: 'listening',
                            id: 1,
                            channel: 'widget'
                        }), '*');
                        sendIframeCommand('addEventListener', ['onStateChange']);
                        sendIframeCommand('addEventListener', ['onError']);
                        sendIframeCommand('setPlaybackQuality', [STATE.experienceMode === 'audio' ? 'small' : 'hd720']);
                        if (STATE.isMuted) {
                            sendIframeCommand('mute');
                        } else if (typeof STATE.volume === 'number') {
                            sendIframeCommand('setVolume', [STATE.volume]);
                        }
                    }
                } catch (e) {}
            };
            mountedIframe.addEventListener('load', () => {
                registerTelemetry();
                setTimeout(registerTelemetry, 350);
                setTimeout(registerTelemetry, 1000);
            });
        }

        const displayTitle = track.title || `Video (${track.videoId})`;
        if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = displayTitle;
        if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = displayTitle;
        if (DOM.nowPlayingSub) {
            DOM.nowPlayingSub.textContent = 'Now Playing';
        }

        // Arm the continuous audio bridge so Android/iOS notification bar stays alive without rapid loop resets
        if (!STATE.bgAudio) {
            try {
                STATE.bgAudio = new Audio(getSilentWavUrl());
                STATE.bgAudio.loop = true;
                STATE.bgAudio.volume = 0.01;
            } catch {}
        }
        if (STATE.bgAudio) {
            STATE.bgAudio.play().catch(() => {});
        }

        // Set rich MediaSession metadata directly after audio activation
        updateMediaSession(track);
        syncAudioDeckUI();
        syncAudioSeekUI();

        renderAll();
    }

    function formatSeconds(sec) {
        if (!sec || !isFinite(sec) || sec < 0) return '0:00';
        const total = Math.floor(sec);
        const hrs = Math.floor(total / 3600);
        const mins = Math.floor((total % 3600) / 60);
        const secs = total % 60;
        if (hrs > 0) {
            return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    function syncExperienceModeUI() {
        const isAudioOnly = STATE.experienceMode === 'audio';
        if (DOM.viewport) {
            DOM.viewport.classList.toggle('is-audio-theme', isAudioOnly);
        }
        if (DOM.playerPane) {
            DOM.playerPane.classList.toggle('is-audio-only-mode', isAudioOnly);
            if (isAudioOnly) {
                DOM.playerPane.classList.remove('is-video-minimized');
            }
        }
        if (DOM.expModeVideoBtn) {
            DOM.expModeVideoBtn.classList.toggle('active', !isAudioOnly);
            DOM.expModeVideoBtn.setAttribute('aria-selected', String(!isAudioOnly));
        }
        if (DOM.expModeAudioBtn) {
            DOM.expModeAudioBtn.classList.toggle('active', isAudioOnly);
            DOM.expModeAudioBtn.setAttribute('aria-selected', String(isAudioOnly));
        }
        if (DOM.audioCatFilterBar) {
            if (isAudioOnly) {
                DOM.audioCatFilterBar.removeAttribute('hidden');
            } else {
                DOM.audioCatFilterBar.setAttribute('hidden', '');
            }
        }
        if (DOM.libraryPanelTitle) {
            DOM.libraryPanelTitle.textContent = isAudioOnly ? '🎧 Music Collections' : 'Libraries';
        }
        if (DOM.libraryTabLabel) {
            DOM.libraryTabLabel.textContent = isAudioOnly ? 'Collections' : 'Library';
        }
        if (DOM.queuePanelTitle) {
            DOM.queuePanelTitle.textContent = isAudioOnly ? '🎧 Audio Queue (Up Next)' : '🎬 Video Queue (Up Next)';
        }
        syncAudioDeckUI();
        syncAudioSeekUI();
    }

    function setExperienceMode(mode) {
        const prevMode = STATE.experienceMode;
        const nextMode = (mode === 'audio') ? 'audio' : 'video';

        if (prevMode !== nextMode) {
            if (prevMode === 'video') {
                STATE.activeVideoLibraryId = STATE.activeLibraryId || 'all-songs';
            } else {
                STATE.activeAudioLibraryId = STATE.activeLibraryId || 'audio-trending-now';
            }
            STATE.experienceMode = nextMode;
            STATE.activeLibraryId = nextMode === 'audio'
                ? (STATE.activeAudioLibraryId || 'audio-trending-now')
                : (STATE.activeVideoLibraryId || 'all-songs');
        } else {
            STATE.experienceMode = nextMode;
        }

        try {
            localStorage.setItem('sonora-experience-mode', STATE.experienceMode);
        } catch (e) {}

        // Optimize background video quality in Pure Audio Mode ('small') to save data/battery while preserving high audio quality
        sendIframeCommand('setPlaybackQuality', [STATE.experienceMode === 'audio' ? 'small' : 'hd720']);

        syncExperienceModeUI();
        renderLibraryTabs();
        renderLibrary();
        renderQueue();
        renderSuggestions();

        showToast(STATE.experienceMode === 'audio'
            ? '🎧 Pure Audio Mode (Music Collections · Low-Data High-Audio Stream)'
            : '🎬 Video & Audio Mode active');
    }

    function syncAudioSeekUI() {
        if (STATE.isSeeking) return;
        const dur = STATE.lastDuration || 0;
        const pos = Math.min(STATE.lastPosition || 0, dur || 99999);
        if (DOM.audioTimeCurrent) {
            DOM.audioTimeCurrent.textContent = formatSeconds(pos);
        }
        if (DOM.audioTimeTotal) {
            DOM.audioTimeTotal.textContent = dur > 0 ? formatSeconds(dur) : (STATE.isPlaying ? 'LIVE' : '0:00');
        }
        if (DOM.audioSeekSlider) {
            if (dur > 0) {
                const ratio = Math.max(0, Math.min(1000, Math.round((pos / dur) * 1000)));
                DOM.audioSeekSlider.value = String(ratio);
            } else {
                DOM.audioSeekSlider.value = '0';
            }
        }
    }

    function syncAudioDeckUI() {
        if (!DOM.audioDeck) return;
        const track = STATE.activeTrack;
        const hasIframe = Boolean(document.getElementById('sonora-active-iframe'));
        const playing = hasIframe && STATE.isPlaying;

        DOM.audioDeck.classList.toggle('is-playing', playing);

        if (DOM.audioStatusText) {
            DOM.audioStatusText.textContent = playing
                ? 'STREAMING PURE AUDIO'
                : (hasIframe ? 'AUDIO PAUSED' : 'PURE AUDIO READY');
        }

        if (DOM.audioPlayPauseIcon) {
            DOM.audioPlayPauseIcon.textContent = playing ? '⏸' : '▶';
        }
        if (DOM.audioArtworkBadge) {
            DOM.audioArtworkBadge.textContent = playing ? '⏸' : '▶';
        }

        if (track) {
            const thumb = getPrimaryThumbnail(track);
            if (DOM.audioArtworkImg && DOM.audioArtworkImg.dataset.vid !== track.videoId) {
                DOM.audioArtworkImg.dataset.vid = track.videoId;
                DOM.audioArtworkImg.src = thumb;
                attachThumbnailFallback(DOM.audioArtworkImg, track.videoId);
            }
            if (DOM.audioDeckBackdrop) {
                DOM.audioDeckBackdrop.style.backgroundImage = `url("${thumb}")`;
            }
            if (DOM.audioTrackTitle) {
                DOM.audioTrackTitle.textContent = track.title || `Track (${track.videoId})`;
            }
            if (DOM.audioTrackSub) {
                const activeLib = getActiveLibrary();
                const cat = track.category || (activeLib ? activeLib.name : 'Sonora Music');
                DOM.audioTrackSub.textContent = `${cat} · Ad-Free Audio Stream`;
            }
            if (DOM.audioFavBtn) {
                const isFav = STATE.favorites.some(f => f.videoId === track.videoId);
                DOM.audioFavBtn.textContent = isFav ? '❤️' : '🤍';
            }
        }

        if (DOM.audioRepeatBtn) {
            DOM.audioRepeatBtn.classList.toggle('active', Boolean(STATE.repeatOne));
        }
        if (DOM.audioMuteBtn) {
            DOM.audioMuteBtn.textContent = (STATE.isMuted || STATE.volume === 0) ? '🔇' : (STATE.volume < 50 ? '🔉' : '🔊');
        }
        if (DOM.audioVolSlider) {
            DOM.audioVolSlider.value = String(STATE.isMuted ? 0 : STATE.volume);
        }
        if (DOM.audioVolLabel) {
            DOM.audioVolLabel.textContent = `${STATE.isMuted ? 0 : STATE.volume}%`;
        }
    }

    function toggleAudioPlayPause() {
        const hasIframe = Boolean(document.getElementById('sonora-active-iframe'));
        if (!hasIframe) {
            if (STATE.activeTrack && STATE.activeTrack.videoId) {
                playTrack(STATE.activeTrack);
            } else {
                const activeLib = getActiveLibrary();
                const first = activeLib && activeLib.videos && activeLib.videos[0] ? activeLib.videos[0] : STATE.items[0];
                if (first) playTrack(first);
            }
            return;
        }

        if (STATE.isPlaying) {
            sendIframeCommand('pauseVideo');
            STATE.isPlaying = false;
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            if (STATE.bgAudio) STATE.bgAudio.pause();
            if (DOM.nowPlayingSub) DOM.nowPlayingSub.textContent = 'Paused';
        } else {
            claimSonoraSession('play');
            sendIframeCommand('playVideo');
            STATE.isPlaying = true;
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            if (STATE.bgAudio) STATE.bgAudio.play().catch(() => {});
            if (DOM.nowPlayingSub) DOM.nowPlayingSub.textContent = 'Now Playing';
        }
        syncAudioDeckUI();
    }

    function updateMediaSession(track) {
        if (!('mediaSession' in navigator) || !track) return;
        try {
            const vid = encodeURIComponent(track.videoId);
            const thumbUrl = getPrimaryThumbnail(track);
            const title = track.title || 'Sonora Music';
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: 'Sonora - Arcade Hub',
                album: 'Sonora Playlist',
                artwork: [
                    { src: thumbUrl, sizes: '512x512', type: 'image/jpeg' },
                    { src: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' },
                    { src: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' },
                    { src: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' },
                    { src: `${window.location.origin}/favicon.png`, sizes: '192x192', type: 'image/png' }
                ]
            });
            navigator.mediaSession.playbackState = 'playing';

            navigator.mediaSession.setActionHandler('play', () => {
                claimSonoraSession('play');
                sendIframeCommand('playVideo');
                STATE.isPlaying = true;
                navigator.mediaSession.playbackState = 'playing';
                if (STATE.bgAudio) STATE.bgAudio.play().catch(() => {});
                syncAudioDeckUI();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                sendIframeCommand('pauseVideo');
                STATE.isPlaying = false;
                navigator.mediaSession.playbackState = 'paused';
                if (STATE.bgAudio) STATE.bgAudio.pause();
                syncAudioDeckUI();
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime != null) {
                    sendIframeCommand('seekTo', [details.seekTime, true]);
                    STATE.lastPosition = details.seekTime;
                    syncAudioSeekUI();
                    if ('setPositionState' in navigator.mediaSession && STATE.lastDuration) {
                        try {
                            navigator.mediaSession.setPositionState({
                                duration: STATE.lastDuration,
                                playbackRate: 1,
                                position: details.seekTime
                            });
                        } catch {}
                    }
                }
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const step = details.seekOffset || 10;
                const nextPos = Math.min(STATE.lastDuration || 9999, (STATE.lastPosition || 0) + step);
                sendIframeCommand('seekTo', [nextPos, true]);
                STATE.lastPosition = nextPos;
                syncAudioSeekUI();
            });
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const step = details.seekOffset || 10;
                const prevPos = Math.max(0, (STATE.lastPosition || 0) - step);
                sendIframeCommand('seekTo', [prevPos, true]);
                STATE.lastPosition = prevPos;
                syncAudioSeekUI();
            });
            navigator.mediaSession.setActionHandler('stop', () => {
                sendIframeCommand('stopVideo');
                STATE.isPlaying = false;
                navigator.mediaSession.playbackState = 'none';
                if (STATE.bgAudio) STATE.bgAudio.pause();
                syncAudioDeckUI();
            });
        } catch (err) {
            console.warn('[Sonora] MediaSession update failed:', err);
        }
    }

    function playPrevious() {
        if (STATE.history.length > 1) {
            const prev = STATE.history[1];
            playTrack(prev);
            showToast(`Playing previous: ${prev.title || prev.videoId}`);
            return;
        }
        const activeLib = getActiveLibrary();
        const videos = (activeLib && activeLib.videos && activeLib.videos.length) ? activeLib.videos : STATE.items;
        const currentIdx = videos.findIndex(v => v.videoId === STATE.activeVideoId);
        if (currentIdx > 0) {
            playTrack(videos[currentIdx - 1]);
            showToast(`Playing previous: ${videos[currentIdx - 1].title || videos[currentIdx - 1].videoId}`);
        } else if (videos.length > 0) {
            playTrack(videos[videos.length - 1]);
            showToast(`Playing: ${videos[videos.length - 1].title || videos[videos.length - 1].videoId}`);
        }
    }

    function playNext() {
        if (STATE.queue.length > 0) {
            const nextTrack = STATE.queue.shift();
            saveState();
            playTrack(nextTrack);
            showToast(`Playing next: ${nextTrack.title || nextTrack.videoId}`);
            return;
        }
        const activeLib = getActiveLibrary();
        const videos = (activeLib && activeLib.videos && activeLib.videos.length) ? activeLib.videos : STATE.items;
        if (videos && videos.length > 0) {
            const currentIdx = videos.findIndex(v => v.videoId === STATE.activeVideoId);
            const nextIdx = (currentIdx >= 0 && currentIdx + 1 < videos.length) ? currentIdx + 1 : 0;
            playTrack(videos[nextIdx]);
            showToast(`Playing next: ${videos[nextIdx].title || videos[nextIdx].videoId}`);
        } else {
            showToast('Select or add a track to play!');
        }
    }

    function addToQueue(track) {
        if (!track || !track.videoId) return;
        const exists = STATE.queue.some(q => q.videoId === track.videoId);
        if (exists) {
            showToast('Already in your queue');
            return;
        }
        STATE.queue.push(track);
        saveState();
        renderQueue();
        showToast('Added to queue 🎵');
    }

    function toggleFavorite(track) {
        if (!track || !track.videoId) return;
        const index = STATE.favorites.indexOf(track.videoId);
        if (index > -1) {
            STATE.favorites.splice(index, 1);
            showToast('Removed from favorites');
        } else {
            STATE.favorites.push(track.videoId);
            showToast('Saved to favorites ❤️');
        }
        saveState();
        renderAll();
    }

    function deleteSaved(videoId) {
        STATE.items = STATE.items.filter(i => i.videoId !== videoId);
        saveState();
        renderAll();
        showToast('Removed song from library');
    }

    function createCustomPlaylist(name) {
        const cleanName = String(name || '').trim();
        if (!cleanName) {
            showToast('Please enter a library name');
            return null;
        }
        const duplicate = STATE.customPlaylists.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
        if (duplicate) {
            STATE.activeLibraryId = duplicate.id;
            renderLibraryTabs();
            renderLibrary();
            showToast(`Switched to existing library "${duplicate.name}" 📁`);
            return duplicate;
        }
        const id = 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        const newLib = {
            id,
            name: cleanName,
            custom: true,
            videos: [],
            createdAt: Date.now()
        };
        STATE.customPlaylists.push(newLib);
        STATE.activeLibraryId = id;
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Created library "${cleanName}" 📁`);
        return newLib;
    }

    function deleteCustomPlaylist(playlistId) {
        const target = STATE.customPlaylists.find(p => p.id === playlistId);
        if (!target) return;
        STATE.customPlaylists = STATE.customPlaylists.filter(p => p.id !== playlistId);
        if (STATE.activeLibraryId === playlistId) {
            STATE.activeLibraryId = STATE.customPlaylists[0]?.id || 'all-songs';
        }
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Deleted library "${target.name}"`);
    }

    function addTrackToCustomPlaylist(track, targetPlaylistId) {
        if (!track || !track.videoId) return;
        if (!targetPlaylistId) {
            openLibraryPickerModal(track);
            return;
        }
        let playlist = STATE.customPlaylists.find(p => p.id === targetPlaylistId);
        if (!playlist) return;

        if (playlist.videos.some(v => v.videoId === track.videoId)) {
            showToast(`Already in "${playlist.name}"`);
            return;
        }
        playlist.videos.unshift({
            id: track.id || `yt-${track.videoId}`,
            videoId: track.videoId,
            title: track.title || `YouTube Video · ${track.videoId}`,
            thumbnail: track.thumbnail || getPrimaryThumbnail(track),
            addedAt: Date.now()
        });
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Added to "${playlist.name}" 📁`);
    }

    function openLibraryPickerModal(track) {
        if (!track || !track.videoId) return;
        STATE.pickerTrack = track;
        if (!DOM.pickerModal || !DOM.pickerList) {
            const fallbackLib = STATE.customPlaylists.find(p => p.id === STATE.activeLibraryId) ||
                                STATE.customPlaylists[0] ||
                                createCustomPlaylist('My Library');
            if (fallbackLib) addTrackToCustomPlaylist(track, fallbackLib.id);
            return;
        }

        if (DOM.pickerTitle) {
            DOM.pickerTitle.textContent = `Add "${track.title || track.videoId}" to Library`;
        }
        DOM.pickerList.innerHTML = '';

        if (!STATE.customPlaylists.length) {
            DOM.pickerList.innerHTML = `<div style="color: var(--sonora-muted); font-size: 0.78rem; padding: 6px 4px;">No custom libraries yet. Create your first library below!</div>`;
        } else {
            STATE.customPlaylists.forEach(lib => {
                const alreadyIn = (lib.videos || []).some(v => v.videoId === track.videoId);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'library-picker-option';
                btn.innerHTML = `
                    <span>📁 ${escapeHtml(lib.name)} <small style="color:var(--sonora-muted);">(${(lib.videos || []).length})</small></span>
                    <span style="color:${alreadyIn ? 'var(--sonora-cyan)' : 'var(--sonora-accent-light)'}; font-size:0.75rem;">
                        ${alreadyIn ? '✓ Added' : '➕ Add'}
                    </span>
                `;
                btn.addEventListener('click', () => {
                    addTrackToCustomPlaylist(track, lib.id);
                    DOM.pickerModal.setAttribute('hidden', '');
                });
                DOM.pickerList.appendChild(btn);
            });
        }

        if (DOM.pickerNewInput) DOM.pickerNewInput.value = '';
        DOM.pickerModal.removeAttribute('hidden');
        if (!STATE.customPlaylists.length && DOM.pickerNewInput) {
            DOM.pickerNewInput.focus();
        }
    }

    function addSongsToLibrary(rawInput, targetLibId, autoPlayFirst = false) {
        const videoIds = extractAllVideoIds(rawInput);
        if (!videoIds.length) {
            showToast('Please paste one or more valid YouTube links');
            return false;
        }

        const activeLib = targetLibId
            ? getAllLibraries().find(l => l.id === targetLibId)
            : getActiveLibrary();

        const addedTracks = [];
        videoIds.forEach((videoId, idx) => {
            const defaultThumb = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
            let existing = STATE.items.find(i => i.videoId === videoId);
            if (!existing) {
                existing = {
                    id: `yt-${videoId}`,
                    videoId,
                    title: `YouTube Video · ${videoId}`,
                    thumbnail: defaultThumb,
                    addedAt: Date.now() + idx
                };
                STATE.items.unshift(existing);
            } else if (!existing.thumbnail) {
                existing.thumbnail = defaultThumb;
            }

            if (activeLib && activeLib.custom) {
                if (!activeLib.videos.some(v => v.videoId === videoId)) {
                    activeLib.videos.unshift({
                        id: existing.id,
                        videoId: existing.videoId,
                        title: existing.title,
                        thumbnail: existing.thumbnail,
                        addedAt: Date.now() + idx
                    });
                }
            }
            addedTracks.push(existing);

            fetchVideoMeta(videoId).then(meta => {
                if (meta) {
                    updateTrackMetaEverywhere(videoId, meta);
                } else {
                    purgeUnavailableVideo(videoId, 'That YouTube link is unavailable or restricted and was removed');
                }
            });
        });

        saveState();
        renderAll();

        if (autoPlayFirst && addedTracks.length > 0) {
            playTrack(addedTracks[0]);
            if (addedTracks.length > 1) {
                const existingQueueIds = new Set(STATE.queue.map(q => q.videoId));
                addedTracks.slice(1).forEach(t => {
                    if (!existingQueueIds.has(t.videoId)) STATE.queue.push(t);
                });
                saveState();
                renderQueue();
            }
        } else if (!STATE.activeVideoId && addedTracks.length > 0) {
            playTrack(addedTracks[0]);
        }

        const libLabel = activeLib && activeLib.custom ? `"${activeLib.name}"` : 'Library';
        showToast(addedTracks.length === 1
            ? `Added song to ${libLabel} 🎶`
            : `Added ${addedTracks.length} songs to ${libLabel} 🎶`);
        return true;
    }

    function removeTrackFromPlaylist(playlistId, videoId) {
        const playlist = STATE.customPlaylists.find(p => p.id === playlistId);
        if (!playlist) return;
        playlist.videos = playlist.videos.filter(v => v.videoId !== videoId);
        saveState();
        renderLibraryTabs();
        renderLibrary();
        showToast(`Removed from "${playlist.name}"`);
    }

    function updateTrackMetaEverywhere(videoId, meta) {
        if (!videoId || !meta) return;
        const formatTitle = (item, rawTitle) => {
            if (!rawTitle) return item.title;
            if (item.category && !rawTitle.toLowerCase().startsWith(item.category.toLowerCase())) {
                return `${item.category} · ${rawTitle}`;
            }
            return rawTitle;
        };
        const applyMeta = (item) => {
            if (item.videoId !== videoId) return;
            if (meta.title) item.title = formatTitle(item, meta.title);
            if (meta.thumbnail) item.thumbnail = meta.thumbnail;
        };
        STATE.items.forEach(applyMeta);
        STATE.videoQueue.forEach(applyMeta);
        STATE.audioQueue.forEach(applyMeta);
        STATE.history.forEach(applyMeta);
        STATE.customPlaylists.forEach(p => (p.videos || []).forEach(applyMeta));
        STATE.curatedLibraries.forEach(p => (p.videos || []).forEach(applyMeta));
        AUDIO_CURATED_COLLECTIONS.forEach(c => (c.videos || []).forEach(applyMeta));
        if (STATE.activeTrack && STATE.activeTrack.videoId === videoId) {
            if (meta.title) {
                const nextTitle = formatTitle(STATE.activeTrack, meta.title);
                STATE.activeTrack.title = nextTitle;
                if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = nextTitle;
                if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = nextTitle;
            }
            if (meta.thumbnail) {
                STATE.activeTrack.thumbnail = meta.thumbnail;
            }
        }
        saveState();
        renderAll();
    }

    // -------------------------------------------------------------------------
    // 4. RENDERING PANELS
    // -------------------------------------------------------------------------
    function createTrackItem(track, options = {}) {
        const isPlaying = STATE.activeVideoId === track.videoId;
        const isFav = STATE.favorites.includes(track.videoId);

        const div = document.createElement('div');
        div.className = `track-item ${isPlaying ? 'playing' : ''}`;

        const thumbUrl = getPrimaryThumbnail(track);
        const safeTitle = escapeHtml(track.title || `YouTube Video · ${track.videoId}`);

        div.innerHTML = `
            <img class="track-thumb" src="${escapeHtml(thumbUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">
            <div class="track-details">
                <span class="track-title" title="${safeTitle}">${safeTitle}</span>
                <span class="track-sub">${isPlaying ? '▶ Now Playing' : 'Tap to play'}</span>
            </div>
            <div class="track-btn-group">
                <button class="track-btn fav ${isFav ? 'active' : ''}" title="${isFav ? 'Remove Favorite' : 'Add Favorite'}">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <button class="track-btn playlist-add" title="Add to Custom Playlist">
                    📁
                </button>
                <button class="track-btn queue-add" title="Add to Queue">
                    ➕
                </button>
                ${options.canDelete ? `<button class="track-btn delete-btn" title="Delete">🗑️</button>` : ''}
            </div>
        `;

        const imgEl = div.querySelector('.track-thumb');
        attachThumbnailFallback(imgEl, track.videoId);

        // Click row to play
        div.addEventListener('click', (e) => {
            if (e.target.closest('.track-btn')) return;
            playTrack(track);
        });

        // Favorite button
        div.querySelector('.fav').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(track);
        });

        // Add to custom playlist button
        div.querySelector('.playlist-add').addEventListener('click', (e) => {
            e.stopPropagation();
            addTrackToCustomPlaylist(track);
        });

        // Queue button
        div.querySelector('.queue-add').addEventListener('click', (e) => {
            e.stopPropagation();
            addToQueue(track);
        });

        // Delete button
        if (options.canDelete) {
            div.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof options.onDelete === 'function') {
                    options.onDelete(track.videoId);
                } else {
                    deleteSaved(track.videoId);
                }
            });
        }

        return div;
    }

    function matchesSearch(track, term) {
        if (!term) return true;
        const q = term.toLowerCase();
        return (track.title || '').toLowerCase().includes(q) ||
               (track.videoId || '').toLowerCase().includes(q) ||
               (track._libName || '').toLowerCase().includes(q);
    }

    function createEmptySearchBox(term) {
        const box = document.createElement('div');
        box.className = 'empty-tab-box';
        box.innerHTML = `
            <span>No saved songs match "${escapeHtml(term)}"</span>
            <small>Try another keyword or search YouTube directly</small>
            <button type="button" class="yt-search-external-btn">🔍 Search "${escapeHtml(term)}" on YouTube ↗</button>
        `;
        box.querySelector('.yt-search-external-btn').addEventListener('click', () => {
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer');
        });
        return box;
    }

    function renderLibraryTabs() {
        if (!DOM.libraryTabs) return;
        DOM.libraryTabs.innerHTML = '';
        const allLibraries = getAllLibraries();

        allLibraries.forEach(lib => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isRegional = Boolean(STATE.regionalSpotlightId && lib.id === STATE.regionalSpotlightId);
            btn.className = `playlist-chip ${lib.id === STATE.activeLibraryId ? 'active' : ''} ${isRegional ? 'featured-regional' : ''}`;
            const label = document.createElement('span');
            label.textContent = `${lib.custom ? '📁 ' : ''}${lib.name} (${(lib.videos || []).length})`;
            btn.appendChild(label);

            if (lib.custom) {
                const del = document.createElement('span');
                del.className = 'playlist-chip-del';
                del.title = `Delete "${lib.name}" library`;
                del.textContent = '×';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteCustomPlaylist(lib.id);
                });
                btn.appendChild(del);
            }

            btn.addEventListener('click', () => {
                STATE.activeLibraryId = lib.id;
                renderLibraryTabs();
                renderLibrary();
            });
            DOM.libraryTabs.appendChild(btn);
        });

        const activeLib = getActiveLibrary();
        if (DOM.libraryAddSongInput && activeLib) {
            DOM.libraryAddSongInput.placeholder = `Paste YouTube link(s) to add to "${activeLib.name}"…`;
        }
    }

    function renderLibrary() {
        if (!DOM.libraryList) return;
        DOM.libraryList.innerHTML = '';

        const activeLib = getActiveLibrary();
        const videos = (activeLib && activeLib.videos) || [];

        if (DOM.libraryCount) DOM.libraryCount.textContent = String(videos.length);

        if (STATE.searchTerm) {
            let filtered = videos.filter(v => matchesSearch(v, STATE.searchTerm));
            // If searching and active library has 0 matches, search across all libraries so user finds their song
            if (!filtered.length) {
                const seen = new Set();
                getAllLibraries().forEach(lib => {
                    (lib.videos || []).forEach(v => {
                        if (!seen.has(v.videoId) && matchesSearch({ ...v, _libName: lib.name }, STATE.searchTerm)) {
                            seen.add(v.videoId);
                            filtered.push(v);
                        }
                    });
                });
            }
            if (!filtered.length) {
                DOM.libraryList.appendChild(createEmptySearchBox(STATE.searchTerm));
                return;
            }
            filtered.forEach(track => {
                DOM.libraryList.appendChild(createTrackItem(track, {
                    canDelete: Boolean(activeLib.custom || activeLib.isAllSongs),
                    onDelete: (videoId) => {
                        if (activeLib.custom) {
                            removeTrackFromPlaylist(activeLib.id, videoId);
                        } else {
                            deleteSaved(videoId);
                        }
                    }
                }));
            });
            return;
        }

        if (!videos.length) {
            const hint = activeLib && activeLib.custom
                ? `Paste YouTube link(s) in the "Add Song" bar above to add songs to "${activeLib.name}"`
                : 'Create a library with "➕ Create Library" or paste a YouTube URL above to add songs';
            DOM.libraryList.innerHTML = `<div class="empty-tab-box"><span>"${escapeHtml(activeLib ? activeLib.name : 'Library')}" is empty</span><small>${escapeHtml(hint)}</small></div>`;
            return;
        }

        videos.forEach(track => {
            DOM.libraryList.appendChild(createTrackItem(track, {
                canDelete: Boolean(activeLib.custom || activeLib.isAllSongs),
                onDelete: (videoId) => {
                    if (activeLib.custom) {
                        removeTrackFromPlaylist(activeLib.id, videoId);
                    } else {
                        deleteSaved(videoId);
                    }
                }
            }));
        });
    }

    function renderQueue() {
        if (!DOM.queueList) return;
        DOM.queueList.innerHTML = '';

        if (DOM.queueCount) DOM.queueCount.textContent = String(STATE.queue.length);

        if (!STATE.queue.length) {
            if (STATE.searchTerm) {
                DOM.queueList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.queueList.innerHTML = `<div class="empty-tab-box"><span>Queue is empty</span><small>Add songs with the ➕ button</small></div>`;
            }
            return;
        }

        const filtered = STATE.queue.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.queueList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach((track) => {
            const idx = STATE.queue.indexOf(track);
            const item = createTrackItem(track, {
                canDelete: true,
                onDelete: () => {
                    if (idx > -1) STATE.queue.splice(idx, 1);
                    saveState();
                    renderQueue();
                }
            });
            DOM.queueList.appendChild(item);
        });
    }

    function renderSaved() {
        if (!DOM.savedList) return;
        DOM.savedList.innerHTML = '';

        if (DOM.savedCount) DOM.savedCount.textContent = String(STATE.items.length);

        if (!STATE.items.length) {
            if (STATE.searchTerm) {
                DOM.savedList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.savedList.innerHTML = `<div class="empty-tab-box"><span>No saved links yet</span><small>Paste a YouTube URL on the left and tap "Play Now"</small></div>`;
            }
            return;
        }

        const filtered = STATE.items.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.savedList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach(track => {
            DOM.savedList.appendChild(createTrackItem(track, { canDelete: true }));
        });
    }

    function renderFavorites() {
        if (!DOM.favoritesList) return;
        DOM.favoritesList.innerHTML = '';

        const allKnown = [...STATE.items, ...STATE.history];
        getAllLibraries().forEach(l => {
            if (l.videos) allKnown.push(...l.videos);
        });

        const favTracks = STATE.favorites.map(favId => {
            return allKnown.find(t => t.videoId === favId) || {
                videoId: favId,
                title: `YouTube Video · ${favId}`,
                thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(favId)}/hqdefault.jpg`
            };
        });

        if (DOM.favoritesCount) DOM.favoritesCount.textContent = String(favTracks.length);

        if (!favTracks.length) {
            if (STATE.searchTerm) {
                DOM.favoritesList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.favoritesList.innerHTML = `<div class="empty-tab-box"><span>No favorite tracks</span><small>Heart any song to save it here</small></div>`;
            }
            return;
        }

        const filtered = favTracks.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.favoritesList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach(track => {
            DOM.favoritesList.appendChild(createTrackItem(track));
        });
    }

    function renderHistory() {
        if (!DOM.historyList) return;
        DOM.historyList.innerHTML = '';

        if (DOM.historyCount) DOM.historyCount.textContent = String(STATE.history.length);

        if (!STATE.history.length) {
            if (STATE.searchTerm) {
                DOM.historyList.appendChild(createEmptySearchBox(STATE.searchTerm));
            } else {
                DOM.historyList.innerHTML = `<div class="empty-tab-box"><span>No watch history</span><small>Played tracks will appear here</small></div>`;
            }
            return;
        }

        const filtered = STATE.history.filter(v => matchesSearch(v, STATE.searchTerm));
        if (!filtered.length && STATE.searchTerm) {
            DOM.historyList.appendChild(createEmptySearchBox(STATE.searchTerm));
            return;
        }

        filtered.forEach(track => {
            DOM.historyList.appendChild(createTrackItem(track));
        });
    }

    function getSuggestedTracks() {
        const pool = [];
        const seen = new Set();
        if (STATE.activeVideoId) {
            seen.add(STATE.activeVideoId);
        }

        const addTrack = (track, sourceLabel, priority = 0) => {
            if (!track || !track.videoId) return;
            if (seen.has(track.videoId)) return;
            seen.add(track.videoId);
            pool.push({
                track,
                sourceLabel,
                priority
            });
        };

        // 1. Current active library (if any)
        const activeLib = (STATE.curatedLibraries || []).find(l => l.id === STATE.activeLibraryId) ||
                          (STATE.customPlaylists || []).find(l => l.id === STATE.activeLibraryId);
        if (activeLib && activeLib.videos) {
            activeLib.videos.forEach(v => addTrack(v, activeLib.name || 'Current Library', 10));
        }

        // 2. Curated built-in libraries
        (STATE.curatedLibraries || []).forEach(lib => {
            (lib.videos || []).forEach(v => addTrack(v, lib.name || 'Featured', 5));
        });

        // 3. User custom playlists
        (STATE.customPlaylists || []).forEach(p => {
            (p.videos || []).forEach(v => addTrack(v, p.name || 'My Playlist', 7));
        });

        // 4. Saved items & favorites & history
        (STATE.items || []).forEach(v => addTrack(v, 'Saved', 4));
        (STATE.favorites || []).forEach(v => addTrack(v, 'Favorite', 6));
        (STATE.history || []).forEach(v => addTrack(v, 'Recent', 3));

        // Keyword relevance matching if activeTrack has title
        const currentTitle = (STATE.activeTrack?.title || '').toLowerCase();
        const keywords = currentTitle
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 4 && !['song', 'video', 'music', 'official', 'lyrics', 'audio', 'deluxe', 'hindi'].includes(w));

        pool.forEach(item => {
            const itemTitle = (item.track.title || '').toLowerCase();
            let matchScore = 0;
            keywords.forEach(kw => {
                if (itemTitle.includes(kw)) matchScore += 15;
            });
            item.priority += matchScore;
        });

        // Sort descending by priority
        pool.sort((a, b) => b.priority - a.priority);

        return pool.slice(0, 10).map(p => ({ ...p.track, sourceLabel: p.sourceLabel }));
    }

    function renderSuggestions() {
        if (!DOM.suggestedList) return;
        const tracks = getSuggestedTracks();
        if (tracks.length === 0) {
            if (DOM.suggestedCard) DOM.suggestedCard.style.display = 'none';
            return;
        }
        if (DOM.suggestedCard) DOM.suggestedCard.style.display = 'flex';

        if (DOM.suggestedBadge) {
            DOM.suggestedBadge.textContent = STATE.activeTrack ? 'Up Next' : 'Featured';
        }

        DOM.suggestedList.innerHTML = tracks.map(t => {
            const thumb = getPrimaryThumbnail(t);
            const title = escapeHtml(t.title || 'Music Track');
            const source = escapeHtml(t.sourceLabel || 'Sonora');
            return `
                <div class="suggested-item" data-video-id="${t.videoId}" title="${title}">
                    <div class="suggested-thumb-wrap">
                        <img src="${thumb}" alt="${title}" class="suggested-thumb" loading="lazy" onerror="this.src='favicon.png'">
                        <div class="suggested-play-overlay">▶</div>
                    </div>
                    <div class="suggested-info">
                        <span class="suggested-song-title">${title}</span>
                        <span class="suggested-song-source">${source}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers to play track directly in Sonora
        DOM.suggestedList.querySelectorAll('.suggested-item').forEach(el => {
            el.addEventListener('click', () => {
                const vid = el.getAttribute('data-video-id');
                const track = tracks.find(t => t.videoId === vid);
                if (track) {
                    playTrack(track);
                    showToast(`Playing ${track.title || 'track'} 🎶`);
                    if (window.innerWidth <= 768 && DOM.playerContainer) {
                        DOM.playerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });
    }

    function renderAll() {
        syncModeButtonUI();
        syncPlayerIdleState();
        syncExperienceModeUI();
        renderLibraryTabs();
        renderLibrary();
        renderQueue();
        renderSaved();
        renderFavorites();
        renderHistory();
        renderSuggestions();
    }

    // -------------------------------------------------------------------------
    // 5. EVENT LISTENERS
    // -------------------------------------------------------------------------
    function initEvents() {
        // Experience Mode Switcher (Video & Audio vs Spotify Pure Audio Mode)
        if (DOM.expModeVideoBtn) {
            DOM.expModeVideoBtn.addEventListener('click', () => setExperienceMode('video'));
        }
        if (DOM.expModeAudioBtn) {
            DOM.expModeAudioBtn.addEventListener('click', () => setExperienceMode('audio'));
        }

        // Audio Collection Category Filter Chips (Trending, Most Viewed, Latest, Artists, Moods)
        if (DOM.audioCatFilterBar) {
            const catChips = DOM.audioCatFilterBar.querySelectorAll('.audio-cat-chip');
            catChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const cat = chip.dataset.audioCat || 'all';
                    STATE.activeAudioCategory = cat;
                    catChips.forEach(c => c.classList.toggle('active', c === chip));
                    const libs = getAllLibraries();
                    if (libs.length > 0 && !libs.some(l => l.id === STATE.activeLibraryId)) {
                        STATE.activeLibraryId = libs[0].id;
                        STATE.activeAudioLibraryId = libs[0].id;
                    }
                    renderLibraryTabs();
                    renderLibrary();
                });
            });
        }

        // Spotify Pure Audio Deck Controls
        if (DOM.audioPlayPauseBtn) {
            DOM.audioPlayPauseBtn.addEventListener('click', toggleAudioPlayPause);
        }
        if (DOM.audioArtworkWrap) {
            DOM.audioArtworkWrap.addEventListener('click', toggleAudioPlayPause);
        }
        if (DOM.audioPrevBtn) {
            DOM.audioPrevBtn.addEventListener('click', () => playPrevious());
        }
        if (DOM.audioNextBtn) {
            DOM.audioNextBtn.addEventListener('click', () => playNext());
        }
        if (DOM.audioRepeatBtn) {
            DOM.audioRepeatBtn.addEventListener('click', () => {
                STATE.repeatOne = !STATE.repeatOne;
                syncAudioDeckUI();
                showToast(STATE.repeatOne ? '🔁 Repeat Current Track: ON' : '🔁 Repeat Current Track: OFF');
            });
        }
        if (DOM.audioShuffleBtn) {
            DOM.audioShuffleBtn.addEventListener('click', () => {
                if (STATE.queue.length >= 2) {
                    shuffleQueue();
                } else {
                    const activeLib = getActiveLibrary();
                    const videos = (activeLib && activeLib.videos && activeLib.videos.length) ? [...activeLib.videos] : [...STATE.items];
                    if (videos.length > 0) {
                        for (let i = videos.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [videos[i], videos[j]] = [videos[j], videos[i]];
                        }
                        const [first, ...rest] = videos;
                        STATE.queue = rest;
                        saveState();
                        playTrack(first);
                        showToast('🔀 Shuffling & playing tracks!');
                    }
                }
            });
        }
        if (DOM.audioFavBtn) {
            DOM.audioFavBtn.addEventListener('click', () => {
                if (STATE.activeTrack) {
                    toggleFavorite(STATE.activeTrack);
                    syncAudioDeckUI();
                }
            });
        }
        if (DOM.audioSeekSlider) {
            DOM.audioSeekSlider.addEventListener('input', (e) => {
                STATE.isSeeking = true;
                const dur = STATE.lastDuration || 0;
                if (dur > 0 && DOM.audioTimeCurrent) {
                    const previewSec = (Number(e.target.value) / 1000) * dur;
                    DOM.audioTimeCurrent.textContent = formatSeconds(previewSec);
                }
            });
            DOM.audioSeekSlider.addEventListener('change', (e) => {
                const dur = STATE.lastDuration || 0;
                if (dur > 0) {
                    const targetSec = (Number(e.target.value) / 1000) * dur;
                    STATE.lastPosition = targetSec;
                    sendIframeCommand('seekTo', [targetSec, true]);
                }
                STATE.isSeeking = false;
                syncAudioSeekUI();
            });
        }
        if (DOM.audioVolSlider) {
            DOM.audioVolSlider.addEventListener('input', (e) => {
                const vol = Math.max(0, Math.min(100, Number(e.target.value)));
                STATE.volume = vol;
                STATE.isMuted = (vol === 0);
                if (STATE.isMuted) {
                    sendIframeCommand('mute');
                } else {
                    sendIframeCommand('unMute');
                    sendIframeCommand('setVolume', [vol]);
                }
                syncAudioDeckUI();
            });
        }
        if (DOM.audioMuteBtn) {
            DOM.audioMuteBtn.addEventListener('click', () => {
                STATE.isMuted = !STATE.isMuted;
                if (STATE.isMuted) {
                    sendIframeCommand('mute');
                } else {
                    if (STATE.volume === 0) STATE.volume = 80;
                    sendIframeCommand('unMute');
                    sendIframeCommand('setVolume', [STATE.volume]);
                }
                syncAudioDeckUI();
            });
        }
        if (DOM.audioVolDownBtn) {
            DOM.audioVolDownBtn.addEventListener('click', () => {
                const nextVol = Math.max(0, (STATE.isMuted ? 0 : STATE.volume) - 10);
                STATE.volume = nextVol;
                STATE.isMuted = (nextVol === 0);
                if (STATE.isMuted) {
                    sendIframeCommand('mute');
                } else {
                    sendIframeCommand('unMute');
                    sendIframeCommand('setVolume', [nextVol]);
                }
                syncAudioDeckUI();
                showToast(`🔉 Volume: ${nextVol}%`);
            });
        }
        if (DOM.audioVolUpBtn) {
            DOM.audioVolUpBtn.addEventListener('click', () => {
                const nextVol = Math.min(100, (STATE.isMuted ? 0 : STATE.volume) + 10);
                STATE.volume = nextVol;
                STATE.isMuted = false;
                sendIframeCommand('unMute');
                sendIframeCommand('setVolume', [nextVol]);
                syncAudioDeckUI();
                showToast(`🔊 Volume: ${nextVol}%`);
            });
        }

        // Smooth local playback timer between YouTube infoDelivery ticks
        setInterval(() => {
            if (STATE.isPlaying && document.getElementById('sonora-active-iframe') && !STATE.isSeeking) {
                if (!STATE.lastDuration || STATE.lastPosition < STATE.lastDuration) {
                    STATE.lastPosition = (STATE.lastPosition || 0) + 0.5;
                    syncAudioSeekUI();
                }
            }
        }, 500);

        // Listen for YouTube IFrame Player API postMessage state changes (auto-advance queue on video end)
        window.addEventListener('message', (event) => {
            if (!event.origin || !event.origin.includes('youtube')) return;
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data) return;
                if (data.event === 'onReady') {
                    sendIframeCommand('setPlaybackQuality', [STATE.experienceMode === 'audio' ? 'small' : 'hd720']);
                    sendIframeCommand('playVideo');
                    STATE.isPlaying = true;
                    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                    syncAudioDeckUI();
                } else if (data.event === 'infoDelivery' && data.info) {
                    if (data.info.playerState === 1) {
                        STATE.isPlaying = true;
                        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                        syncAudioDeckUI();
                    } else if (data.info.playerState === 2) {
                        STATE.isPlaying = false;
                        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
                        syncAudioDeckUI();
                    } else if (data.info.playerState === 0) {
                        if (STATE.repeatOne && STATE.activeTrack) {
                            sendIframeCommand('seekTo', [0, true]);
                            sendIframeCommand('playVideo');
                            STATE.lastPosition = 0;
                            STATE.isPlaying = true;
                        } else {
                            playNext();
                        }
                    }

                    // Sync video title if delivered from YouTube
                    if (data.info.videoData && data.info.videoData.title && STATE.activeTrack) {
                        if (!STATE.activeTrack.title || STATE.activeTrack.title.startsWith('Video (')) {
                            STATE.activeTrack.title = data.info.videoData.title;
                            if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = data.info.videoData.title;
                            if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = data.info.videoData.title;
                            updateMediaSession(STATE.activeTrack);
                            syncAudioDeckUI();
                        }
                    }

                    // Sync duration and current playback progress
                    if (typeof data.info.duration === 'number' && data.info.duration > 0) {
                        STATE.lastDuration = data.info.duration;
                    }
                    if (typeof data.info.currentTime === 'number') {
                        STATE.lastPosition = data.info.currentTime;
                    }
                    syncAudioSeekUI();

                    if (STATE.lastDuration && 'mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
                        try {
                            const curTime = Math.min(STATE.lastPosition, STATE.lastDuration);
                            navigator.mediaSession.setPositionState({
                                duration: STATE.lastDuration,
                                playbackRate: 1,
                                position: curTime
                            });
                        } catch {}
                    }
                } else if (data.event === 'onError') {
                    const failedId = STATE.activeVideoId;
                    if (failedId) {
                        purgeUnavailableVideo(failedId, '⚠️ Track unavailable on YouTube — removed & skipping to next song');
                        setTimeout(() => playNext(), 350);
                    }
                } else if (data.event === 'onStateChange') {
                    if (data.info === 1) {
                        STATE.isPlaying = true;
                        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                        syncAudioDeckUI();
                    } else if (data.info === 2) {
                        STATE.isPlaying = false;
                        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
                        syncAudioDeckUI();
                    } else if (data.info === 0) {
                        if (STATE.repeatOne && STATE.activeTrack) {
                            sendIframeCommand('seekTo', [0, true]);
                            sendIframeCommand('playVideo');
                            STATE.lastPosition = 0;
                            STATE.isPlaying = true;
                        } else {
                            playNext();
                        }
                    }
                }
            } catch {}
        });

        // Form: Add Link (Left pane Play Now)
        if (DOM.addForm) {
            DOM.addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputVal = DOM.addInput ? DOM.addInput.value.trim() : '';
                if (addSongsToLibrary(inputVal, STATE.activeLibraryId, true)) {
                    if (DOM.addInput) DOM.addInput.value = '';
                }
            });
        }

        // Quick Clipboard Paste Link Button (Mobile / iPhone / Desktop)
        const pasteBtn = document.getElementById('paste-clip-btn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                            if (DOM.addInput) DOM.addInput.value = text.trim();
                            const vid = getVideoId(text);
                            if (vid) {
                                if (addSongsToLibrary(text.trim(), STATE.activeLibraryId, true)) {
                                    if (DOM.addInput) DOM.addInput.value = '';
                                    showToast('Pasted & playing YouTube track! 🎵');
                                }
                            } else {
                                showToast('Pasted text from clipboard 📋');
                            }
                        } else {
                            showToast('Clipboard is empty 📋');
                        }
                    } else {
                        showToast('Please long-press and paste into the box 📋');
                    }
                } catch (e) {
                    showToast('Please long-press and paste into the box 📋');
                }
            });
        }

        // Toggle Add Song bar inside Library panel
        if (DOM.toggleAddSongBtn && DOM.libraryAddSongForm) {
            DOM.toggleAddSongBtn.addEventListener('click', () => {
                const isHidden = DOM.libraryAddSongForm.hasAttribute('hidden');
                if (isHidden) {
                    DOM.libraryAddSongForm.removeAttribute('hidden');
                    if (DOM.newPlaylistForm) DOM.newPlaylistForm.setAttribute('hidden', '');
                    if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.focus();
                } else {
                    DOM.libraryAddSongForm.setAttribute('hidden', '');
                }
            });
        }

        if (DOM.cancelAddSongBtn && DOM.libraryAddSongForm) {
            DOM.cancelAddSongBtn.addEventListener('click', () => {
                DOM.libraryAddSongForm.setAttribute('hidden', '');
                if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.value = '';
            });
        }

        // Form: Add Song(s) directly inside selected Library
        if (DOM.libraryAddSongForm) {
            DOM.libraryAddSongForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const inputVal = DOM.libraryAddSongInput ? DOM.libraryAddSongInput.value.trim() : '';
                if (addSongsToLibrary(inputVal, STATE.activeLibraryId, false)) {
                    if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.value = '';
                    DOM.libraryAddSongForm.setAttribute('hidden', '');
                }
            });
        }

        function resetMiniPlayerPosition() {
            if (!DOM.playerContainer) return;
            DOM.playerContainer.style.left = '';
            DOM.playerContainer.style.top = '';
            DOM.playerContainer.style.right = '';
            DOM.playerContainer.style.bottom = '';
            DOM.playerContainer.classList.remove('is-dragging');
        }

        // Video Minimize / Expand button (Mini Player & Floating PiP mode)
        const toggleMiniPlayer = () => {
            if (!DOM.playerPane) return;
            const minimized = DOM.playerPane.classList.toggle('is-video-minimized');
            resetMiniPlayerPosition();
            if (minimized) {
                try {
                    localStorage.setItem('sonora_mini_active', 'true');
                    if (STATE.activeTrack) {
                        localStorage.setItem('sonora_active_track', JSON.stringify(STATE.activeTrack));
                        localStorage.setItem('sonora_active_video_id', STATE.activeTrack.videoId);
                    }
                } catch {}
            } else {
                try {
                    localStorage.removeItem('sonora_mini_active');
                } catch {}
            }
            if (DOM.minVideoBtn) {
                DOM.minVideoBtn.classList.toggle('active', minimized);
                DOM.minVideoBtn.innerHTML = minimized ? '▴ <span>Expand</span>' : '🗗 <span>Mini</span>';
            }
            if (minimized) {
                showToast('Mini player active 🗗 (Persistent across all games and pages in Arcade Hub!)');
            } else {
                showToast('Player expanded 📺');
            }
        };

        if (DOM.minVideoBtn) {
            DOM.minVideoBtn.addEventListener('click', toggleMiniPlayer);
        }

        function isSonoraTargetUrl(url) {
            if (!url || typeof url !== 'string') return false;
            const cleanBase = url.split('?')[0].split('#')[0].trim().toLowerCase();
            return cleanBase === 'sonora' ||
                   cleanBase === 'sonora.html' ||
                   cleanBase === '/sonora' ||
                   cleanBase === '/sonora.html' ||
                   cleanBase.endsWith('/sonora') ||
                   cleanBase.endsWith('/sonora.html');
        }

        function handleSonoraRedirect(targetUrl) {
            closeHubBrowser();
            if (DOM.playerPane && DOM.playerPane.classList.contains('is-video-minimized')) {
                toggleMiniPlayer();
            }
            if (targetUrl && typeof targetUrl === 'string' && targetUrl.includes('?')) {
                try {
                    const qIndex = targetUrl.indexOf('?');
                    const params = new URLSearchParams(targetUrl.slice(qIndex));
                    const libParam = params.get('lib');
                    if (libParam) {
                        const matched = getAllLibraries().find(l =>
                            l.id === libParam ||
                            l.id === `default-${libParam}` ||
                            l.name.toLowerCase().includes(libParam.toLowerCase())
                        );
                        if (matched) {
                            STATE.activeLibraryId = matched.id;
                            renderLibraryTabs();
                            renderLibrary();
                            showToast(`Switched to "${matched.name}" library 🎵`);
                        }
                    }
                } catch (e) {}
            }
        }

        function openHubBrowser(targetUrl = 'index.html') {
            if (isSonoraTargetUrl(targetUrl)) {
                handleSonoraRedirect(targetUrl);
                return;
            }
            const overlay = document.getElementById('sonora-hub-overlay');
            const frame = document.getElementById('sonora-hub-frame');
            if (!overlay || !frame) return;

            const cleanTarget = targetUrl.includes('?') ? `${targetUrl}&in_sonora=1` : `${targetUrl}?in_sonora=1`;
            frame.src = cleanTarget;

            overlay.removeAttribute('hidden');
            showToast('Browsing Arcade Hub 🎮 (Music playing in background!)');
        }

        function closeHubBrowser() {
            const overlay = document.getElementById('sonora-hub-overlay');
            const frame = document.getElementById('sonora-hub-frame');
            if (overlay) {
                overlay.setAttribute('hidden', '');
            }
            if (frame && frame.src && frame.src !== 'about:blank') {
                try { frame.src = 'about:blank'; } catch (e) {}
            }
        }

        const hubFrameEl = document.getElementById('sonora-hub-frame');
        if (hubFrameEl) {
            hubFrameEl.addEventListener('load', () => {
                try {
                    const loc = hubFrameEl.contentWindow && hubFrameEl.contentWindow.location;
                    if (loc && loc.pathname && isSonoraTargetUrl(loc.pathname)) {
                        handleSonoraRedirect(loc.href);
                    }
                } catch (e) {}
            });
        }

        window.openHubBrowser = openHubBrowser;
        window.closeHubBrowser = closeHubBrowser;
        window.handleSonoraRedirect = handleSonoraRedirect;

        function isPlayerActivelyRunning() {
            return Boolean(document.getElementById('sonora-active-iframe') && STATE.activeTrack && STATE.activeVideoId);
        }

        // Intercept Home button click so actively playing music never unloads
        const homeBtn = document.querySelector('.home-icon-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                if (isPlayerActivelyRunning()) {
                    e.preventDefault();
                    openHubBrowser('index.html');
                }
            });
        }

        // Intercept Footer navigation links
        document.querySelectorAll('.sonora-footer a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                link.addEventListener('click', (e) => {
                    if (isSonoraTargetUrl(href)) {
                        e.preventDefault();
                        handleSonoraRedirect(href);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }
                    if (isPlayerActivelyRunning()) {
                        e.preventDefault();
                        const target = href === '/' ? 'index.html' : (href.endsWith('.html') ? href : href + '.html');
                        openHubBrowser(target);
                    }
                });
            }
        });

        // Close hub overlay when clicking Back to Sonora
        const hubBackBtn = document.getElementById('sonora-hub-back-btn');
        if (hubBackBtn) {
            hubBackBtn.addEventListener('click', () => {
                closeHubBrowser();
                if (DOM.playerPane && DOM.playerPane.classList.contains('is-video-minimized')) {
                    toggleMiniPlayer();
                }
            });
        }

        const miniExpandBtn = document.getElementById('mini-expand-btn');
        if (miniExpandBtn) {
            miniExpandBtn.addEventListener('click', () => {
                closeHubBrowser();
                toggleMiniPlayer();
            });
        }

        const miniPlaceholder = document.getElementById('mini-player-placeholder');
        if (miniPlaceholder) {
            miniPlaceholder.addEventListener('click', () => {
                closeHubBrowser();
                toggleMiniPlayer();
            });
        }

        // Smooth Draggable Mini Player across entire browser screen (Mouse & Touch)
        function initMiniPlayerDragging() {
            const handle = document.getElementById('mini-drag-handle');
            const container = DOM.playerContainer;
            if (!handle || !container) return;

            let isDragging = false;
            let startPointerX = 0;
            let startPointerY = 0;
            let startElemX = 0;
            let startElemY = 0;

            const onPointerDown = (e) => {
                if (!DOM.playerPane || !DOM.playerPane.classList.contains('is-video-minimized')) return;
                if (e.target.closest('#mini-expand-btn')) return;
                isDragging = true;
                startPointerX = e.clientX;
                startPointerY = e.clientY;

                const rect = container.getBoundingClientRect();
                startElemX = rect.left;
                startElemY = rect.top;

                container.style.bottom = 'auto';
                container.style.right = 'auto';
                container.style.left = `${startElemX}px`;
                container.style.top = `${startElemY}px`;
                container.classList.add('is-dragging');

                if (handle.setPointerCapture && e.pointerId != null) {
                    try { handle.setPointerCapture(e.pointerId); } catch {}
                }
                e.preventDefault();
            };

            const onPointerMove = (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startPointerX;
                const dy = e.clientY - startPointerY;

                const rect = container.getBoundingClientRect();
                const w = rect.width;
                const h = rect.height;

                const maxLeft = Math.max(0, window.innerWidth - w - 6);
                const maxTop = Math.max(0, window.innerHeight - h - 6);

                const newLeft = Math.max(6, Math.min(maxLeft, startElemX + dx));
                const newTop = Math.max(6, Math.min(maxTop, startElemY + dy));

                container.style.left = `${newLeft}px`;
                container.style.top = `${newTop}px`;
            };

            const onPointerUp = (e) => {
                if (!isDragging) return;
                isDragging = false;
                container.classList.remove('is-dragging');
                if (handle.releasePointerCapture && e.pointerId != null) {
                    try { handle.releasePointerCapture(e.pointerId); } catch {}
                }
                const rect = container.getBoundingClientRect();
                try {
                    localStorage.setItem('sonora_mini_pos', JSON.stringify({ left: rect.left, top: rect.top }));
                } catch {}
            };

            handle.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove, { passive: true });
            window.addEventListener('pointerup', onPointerUp, { passive: true });
            window.addEventListener('pointercancel', onPointerUp, { passive: true });
        }
        initMiniPlayerDragging();

        // Custom Library Creation UI
        if (DOM.newPlaylistBtn && DOM.newPlaylistForm) {
            DOM.newPlaylistBtn.addEventListener('click', () => {
                const isHidden = DOM.newPlaylistForm.hasAttribute('hidden');
                if (isHidden) {
                    DOM.newPlaylistForm.removeAttribute('hidden');
                    if (DOM.libraryAddSongForm) DOM.libraryAddSongForm.setAttribute('hidden', '');
                    if (DOM.newPlaylistInput) DOM.newPlaylistInput.focus();
                } else {
                    DOM.newPlaylistForm.setAttribute('hidden', '');
                }
            });

            if (DOM.cancelPlaylistBtn) {
                DOM.cancelPlaylistBtn.addEventListener('click', () => {
                    DOM.newPlaylistForm.setAttribute('hidden', '');
                    if (DOM.newPlaylistInput) DOM.newPlaylistInput.value = '';
                });
            }

            DOM.newPlaylistForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = DOM.newPlaylistInput ? DOM.newPlaylistInput.value.trim() : '';
                if (!name) {
                    showToast('Enter a name for your library');
                    return;
                }
                createCustomPlaylist(name);
                if (DOM.newPlaylistInput) DOM.newPlaylistInput.value = '';
                DOM.newPlaylistForm.setAttribute('hidden', '');
                if (DOM.libraryAddSongForm) DOM.libraryAddSongForm.removeAttribute('hidden');
                if (DOM.libraryAddSongInput) DOM.libraryAddSongInput.focus();
            });
        }

        // Library Picker Modal events
        if (DOM.pickerClose && DOM.pickerModal) {
            DOM.pickerClose.addEventListener('click', () => {
                DOM.pickerModal.setAttribute('hidden', '');
            });
            DOM.pickerModal.addEventListener('click', (e) => {
                if (e.target === DOM.pickerModal) {
                    DOM.pickerModal.setAttribute('hidden', '');
                }
            });
        }
        if (DOM.pickerNewForm && DOM.pickerModal) {
            DOM.pickerNewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = DOM.pickerNewInput ? DOM.pickerNewInput.value.trim() : '';
                if (!name) {
                    showToast('Enter a library name');
                    return;
                }
                const created = createCustomPlaylist(name);
                if (created && STATE.pickerTrack) {
                    addTrackToCustomPlaylist(STATE.pickerTrack, created.id);
                }
                if (DOM.pickerNewInput) DOM.pickerNewInput.value = '';
                DOM.pickerModal.setAttribute('hidden', '');
            });
        }

        // Mode Toggle Button (Ad-Free No-Cookie vs Standard YouTube Embed)
        if (DOM.modeBtn) {
            DOM.modeBtn.addEventListener('click', () => {
                STATE.mode = STATE.mode === 'official' ? 'adfree' : 'official';
                saveState();
                syncModeButtonUI();
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                }
                showToast(STATE.mode === 'adfree'
                    ? 'Switched to Ad-Free Mode 🛡️'
                    : 'Switched to Standard Embed Mode 📺');
            });
        }

        // Tab Switching
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                STATE.activeTab = target;

                DOM.tabs.forEach(t => t.classList.toggle('active', t === tab));
                DOM.tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
                try { tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); } catch (e) {}
            });
        });

        // Search Form & Live Filtering
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', (e) => {
                STATE.searchTerm = e.target.value.trim();
                if (DOM.searchClear) {
                    if (STATE.searchTerm) {
                        DOM.searchClear.removeAttribute('hidden');
                    } else {
                        DOM.searchClear.setAttribute('hidden', '');
                    }
                }
                // Also allow searching library names directly
                if (STATE.searchTerm) {
                    const matchedLib = STATE.customPlaylists.find(
                        l => l.name.toLowerCase() === STATE.searchTerm.toLowerCase()
                    );
                    if (matchedLib) {
                        STATE.activeLibraryId = matchedLib.id;
                    }
                }
                renderAll();
            });
        }

        if (DOM.searchClear && DOM.searchInput) {
            DOM.searchClear.addEventListener('click', () => {
                DOM.searchInput.value = '';
                STATE.searchTerm = '';
                DOM.searchClear.setAttribute('hidden', '');
                renderAll();
                DOM.searchInput.focus();
            });
        }

        if (DOM.searchForm) {
            DOM.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const term = DOM.searchInput ? DOM.searchInput.value.trim() : '';
                if (!term) {
                    showToast('Type a song title, library name, or YouTube query');
                    return;
                }
                // If user pasted a YouTube link into search, add & play it directly
                const extractedIds = extractAllVideoIds(term);
                if (extractedIds.length > 0 && (term.includes('youtu') || extractedIds[0] === term)) {
                    addSongsToLibrary(term, STATE.activeLibraryId, true);
                    DOM.searchInput.value = '';
                    STATE.searchTerm = '';
                    if (DOM.searchClear) DOM.searchClear.setAttribute('hidden', '');
                    renderAll();
                    return;
                }
                // Check if any saved song matches
                const allSongs = [...STATE.items];
                STATE.customPlaylists.forEach(p => (p.videos || []).forEach(v => {
                    if (!allSongs.some(s => s.videoId === v.videoId)) allSongs.push(v);
                }));
                const matches = allSongs.filter(s => matchesSearch(s, term));
                if (matches.length > 0) {
                    renderAll();
                    showToast(`Found ${matches.length} saved song${matches.length === 1 ? '' : 's'} matching "${term}"`);
                } else {
                    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, '_blank', 'noopener,noreferrer');
                    showToast(`Searching YouTube for "${term}" ↗`);
                }
            });
        }

        // Skip button (Next in Queue)
        if (DOM.skipBtn) {
            DOM.skipBtn.addEventListener('click', () => {
                playNext();
            });
        }

        // Reload player button
        if (DOM.reloadBtn) {
            DOM.reloadBtn.addEventListener('click', () => {
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                    showToast('Reloaded player 🔄');
                }
            });
        }

        // Universal Fullscreen (works on Desktop, Android, iPad, and iPhone iOS Safari/Chrome)
        const enterFullscreen = () => {
            if (!DOM.playerContainer) return;
            if (!document.getElementById('sonora-active-iframe')) {
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                } else if (STATE.items.length > 0) {
                    playTrack(STATE.items[0]);
                } else {
                    showToast('Add or select a song first to play in full screen');
                    return;
                }
            }
            STATE.isFullscreen = true;
            DOM.playerContainer.classList.add('is-fullscreen');
            if (DOM.fullscreenBtn) DOM.fullscreenBtn.classList.add('active');

            // Request native browser fullscreen where supported (Desktop / Android / iPad)
            const reqFs = DOM.playerContainer.requestFullscreen ||
                          DOM.playerContainer.webkitRequestFullscreen ||
                          DOM.playerContainer.msRequestFullscreen;
            if (reqFs) {
                Promise.resolve(reqFs.call(DOM.playerContainer)).then(() => {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(() => {});
                    }
                }).catch(() => {});
            }
        };

        const exitFullscreen = () => {
            if (!DOM.playerContainer) return;
            STATE.isFullscreen = false;
            DOM.playerContainer.classList.remove('is-fullscreen');
            if (DOM.fullscreenBtn) DOM.fullscreenBtn.classList.remove('active');

            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (fsEl) {
                const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
                if (exitFs) Promise.resolve(exitFs.call(document)).catch(() => {});
            }
            if (screen.orientation && screen.orientation.unlock) {
                try { screen.orientation.unlock(); } catch {}
            }
        };

        const toggleFullscreen = () => {
            const isActive = STATE.isFullscreen ||
                             Boolean(document.fullscreenElement || document.webkitFullscreenElement) ||
                             (DOM.playerContainer && DOM.playerContainer.classList.contains('is-fullscreen'));
            if (isActive) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
        };

        if (DOM.fullscreenBtn) {
            DOM.fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        if (DOM.fsExitBtn) {
            DOM.fsExitBtn.addEventListener('click', exitFullscreen);
        }
        if (DOM.fsNextBtn) {
            DOM.fsNextBtn.addEventListener('click', () => playNext());
        }
        if (DOM.fsReloadBtn) {
            DOM.fsReloadBtn.addEventListener('click', () => {
                if (STATE.activeTrack) {
                    playTrack(STATE.activeTrack);
                    showToast('Reloaded player 🔄');
                }
            });
        }

        const syncNativeFullscreenExit = () => {
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
            if (!fsEl && STATE.isFullscreen) {
                STATE.isFullscreen = false;
                if (DOM.playerContainer) DOM.playerContainer.classList.remove('is-fullscreen');
                if (DOM.fullscreenBtn) DOM.fullscreenBtn.classList.remove('active');
            }
        };
        document.addEventListener('fullscreenchange', syncNativeFullscreenExit);
        document.addEventListener('webkitfullscreenchange', syncNativeFullscreenExit);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && STATE.isFullscreen) {
                exitFullscreen();
            }
        });

        // Background play helper (silent WAV audio keeps WebAudio / MediaSession alive on mobile)
        if (DOM.bgPlayBtn) {
            DOM.bgPlayBtn.addEventListener('click', () => {
                STATE.bgPlay = !STATE.bgPlay;
                DOM.bgPlayBtn.classList.toggle('active', STATE.bgPlay);
                if (STATE.bgPlay) {
                    if (!STATE.bgAudio) {
                        STATE.bgAudio = new Audio(getSilentWavUrl());
                        STATE.bgAudio.loop = true;
                        STATE.bgAudio.volume = 0.01;
                    }
                    STATE.bgAudio.play().catch(() => {});
                    showToast('Background Play: ON (Keeps media session active)');
                } else if (STATE.bgAudio) {
                    STATE.bgAudio.pause();
                    showToast('Background Play: OFF');
                }
            });
        }

        // Playlist Play All & Queue All
        if (DOM.playAllLibraryBtn) {
            DOM.playAllLibraryBtn.addEventListener('click', () => {
                const activeLib = getActiveLibrary();
                if (!activeLib || !activeLib.videos.length) {
                    showToast('This playlist has no tracks yet');
                    return;
                }
                const [first, ...rest] = activeLib.videos;
                STATE.queue = [...rest];
                saveState();
                playTrack(first);
                showToast(`Playing "${activeLib.name}" playlist!`);
            });
        }

        if (DOM.queueAllLibraryBtn) {
            DOM.queueAllLibraryBtn.addEventListener('click', () => {
                const activeLib = getActiveLibrary();
                if (!activeLib || !activeLib.videos.length) {
                    showToast('This playlist has no tracks yet');
                    return;
                }
                const existing = new Set(STATE.queue.map(q => q.videoId));
                const added = activeLib.videos.filter(v => !existing.has(v.videoId));
                STATE.queue.push(...added);
                saveState();
                renderQueue();
                showToast(`Added ${added.length} tracks to queue`);
            });
        }

        // Queue Clear & Shuffle
        if (DOM.clearQueueBtn) {
            DOM.clearQueueBtn.addEventListener('click', () => {
                STATE.queue = [];
                saveState();
                renderQueue();
                showToast('Queue cleared');
            });
        }

        if (DOM.shuffleQueueBtn) {
            DOM.shuffleQueueBtn.addEventListener('click', () => {
                for (let i = STATE.queue.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [STATE.queue[i], STATE.queue[j]] = [STATE.queue[j], STATE.queue[i]];
                }
                saveState();
                renderQueue();
                showToast('Queue shuffled 🔀');
            });
        }

        // Backup & Restore JSON
        if (DOM.exportSavedBtn) {
            DOM.exportSavedBtn.addEventListener('click', () => {
                const payload = {
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    items: STATE.items,
                    customPlaylists: STATE.customPlaylists,
                    favorites: STATE.favorites,
                    queue: STATE.videoQueue,
                    videoQueue: STATE.videoQueue,
                    audioQueue: STATE.audioQueue
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sonora-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                showToast('Downloaded Sonora backup JSON ⬇️');
            });
        }

        if (DOM.importSavedInput) {
            DOM.importSavedInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const parsed = JSON.parse(String(reader.result || '{}'));
                        if (Array.isArray(parsed)) {
                            STATE.items = parsed;
                        } else {
                            if (Array.isArray(parsed.items)) STATE.items = parsed.items;
                            if (Array.isArray(parsed.customPlaylists)) STATE.customPlaylists = parsed.customPlaylists;
                            if (Array.isArray(parsed.favorites)) STATE.favorites = parsed.favorites;
                            if (Array.isArray(parsed.videoQueue)) {
                                STATE.videoQueue = parsed.videoQueue;
                            } else if (Array.isArray(parsed.queue)) {
                                STATE.videoQueue = parsed.queue;
                            }
                            if (Array.isArray(parsed.audioQueue)) STATE.audioQueue = parsed.audioQueue;
                        }
                        saveState();
                        renderAll();
                        showToast('Restored Sonora backup successfully! ⬆️');
                    } catch {
                        showToast('Invalid backup JSON file');
                    }
                    DOM.importSavedInput.value = '';
                };
                reader.readAsText(file);
            });
        }
    }

    // Handle incoming Web Share Target URLs (from Android share sheet / YouTube app)
    async function handleIncomingSharedTarget() {
        try {
            const params = new URLSearchParams(window.location.search);
            const sharedUrl = params.get('url') || '';
            const sharedText = params.get('text') || '';
            const sharedTitle = params.get('title') || '';
            
            const raw = `${sharedUrl} ${sharedText} ${sharedTitle}`.trim();
            if (!raw) return;

            const videoId = getVideoId(sharedUrl) || getVideoId(sharedText) || getVideoId(raw);
            if (!videoId) return;

            // Clear query params from address bar cleanly without reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            let title = (sharedTitle && !sharedTitle.startsWith('http')) 
                ? sharedTitle 
                : (sharedText && !sharedText.startsWith('http') && sharedText.length < 80 ? sharedText : `YouTube Track`);

            let artist = 'Shared from YouTube';

            // Attempt to fetch real oEmbed title
            try {
                const meta = await fetchVideoMeta(videoId);
                if (meta && meta.title) {
                    title = meta.title;
                }
            } catch (e) {}

            const track = {
                id: `shared_${videoId}_${Date.now()}`,
                videoId: videoId,
                title: title,
                artist: artist,
                thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
                sharedAt: new Date().toISOString()
            };

            STATE.items.unshift(track);
            saveState();
            renderAll();

            playTrack(track, true);
            showToast(`Imported & Playing: "${title}" 🎵`);
            return true;
        } catch (err) {
            console.warn('[Sonora] Error handling incoming shared target:', err);
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // 6. INITIAL RUN
    // -------------------------------------------------------------------------
    
    async function initSonoraRegionalSpotlight() {
        if (!window.ArcadeAmbient) return;
        const timeVibe = window.ArcadeAmbient.getTimeVibe();
        const fallbackGeo = window.ArcadeAmbient.getLocationFromTimezone();
        updateSpotlightUI(fallbackGeo, timeVibe);

        const geo = await window.ArcadeAmbient.resolveGeo();
        if (geo && geo.city !== fallbackGeo.city) {
            updateSpotlightUI(geo, timeVibe);
        }
    }

    function updateSpotlightUI(geo, timeVibe) {
        if (!window.ArcadeAmbient) return;
        const spotlight = window.ArcadeAmbient.getRegionalSpotlight(geo, timeVibe);
        STATE.regionalSpotlightId = spotlight.libId;
        renderLibraryTabs();

        const bar = document.getElementById('regionalSpotlightBar');
        const tag = document.getElementById('spotlightTag');
        const text = document.getElementById('spotlightText');
        const btn = document.getElementById('spotlightSwitchBtn');

        if (bar && tag && text) {
            tag.textContent = spotlight.badgeText || '📍 SPOTLIGHT';
            const locName = (geo.city && geo.city !== 'Cyber City' && geo.city !== 'India') ? geo.city : 'you';
            text.innerHTML = `Trending near ${escapeHtml(locName)}: <strong>${escapeHtml(spotlight.title)}</strong>`;
            bar.style.display = 'flex';

            if (btn && !btn._hasSpotlightListener) {
                btn._hasSpotlightListener = true;
                btn.addEventListener('click', () => {
                    const matchedLib = getAllLibraries().find(l => l.id === spotlight.libId);
                    if (matchedLib) {
                        STATE.activeLibraryId = matchedLib.id;
                        renderLibraryTabs();
                        renderLibrary();
                        if (matchedLib.videos && matchedLib.videos.length > 0) {
                            playTrack(matchedLib.videos[0]);
                        }
                    }
                });
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Immediately claim active Sonora session on entry so any other open Sonora tab stops playing
        claimSonoraSession('page_enter');

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) reg.update().catch(() => {});
            }).catch(() => {});
        }
        loadStorage();
        if (STATE.experienceMode === 'audio') {
            STATE.activeLibraryId = STATE.activeAudioLibraryId || 'audio-trending-now';
        }
        syncExperienceModeUI();
        loadFromIndexedDB().then(idbData => {
            if (idbData && (!STATE.items.length && Array.isArray(idbData.items) && idbData.items.length)) {
                STATE.items = idbData.items;
            }
            if (idbData && (!STATE.customPlaylists.length && Array.isArray(idbData.customPlaylists) && idbData.customPlaylists.length)) {
                STATE.customPlaylists = idbData.customPlaylists;
            }
            hydratePlaceholderTitles();
            renderAll();
        });
        hydratePlaceholderTitles();
        initEvents();
        loadLibraries().then(async () => {
            // URL Library Parameter Support (?lib=karan-aujla)
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const libParam = urlParams.get('lib');
                if (libParam) {
                    const matched = getAllLibraries().find(l => l.id === libParam || l.id === `default-${libParam}` || l.name.toLowerCase().includes(libParam.toLowerCase()));
                    if (matched) {
                        STATE.activeLibraryId = matched.id;
                        renderLibraryTabs();
                        renderLibrary();
                    }
                }
            } catch (e) {}

            // Regional Spotlight Init
            try {
                if (window.ArcadeAmbient) {
                    initSonoraRegionalSpotlight();
                }
            } catch (e) {}

            const wasHandled = await handleIncomingSharedTarget();
            if (wasHandled) return;

            if (STATE.activeVideoId && DOM.playerContainer) {
                const allKnown = [...STATE.items, ...STATE.history];
                getAllLibraries().forEach(l => { if (l.videos) allKnown.push(...l.videos); });
                const track = allKnown.find(t => t.videoId === STATE.activeVideoId) || {
                    videoId: STATE.activeVideoId,
                    title: `YouTube Video · ${STATE.activeVideoId}`,
                    thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(STATE.activeVideoId)}/hqdefault.jpg`
                };
                STATE.activeTrack = track;
                const stage = DOM.playerStage || DOM.playerContainer;
                stage.innerHTML = `
                    <button type="button" class="resume-poster" aria-label="Resume last track">
                        <img class="resume-thumb" src="${escapeHtml(getPrimaryThumbnail(track))}" alt="" referrerpolicy="no-referrer">
                        <span class="resume-overlay">▶ <strong>Tap to resume</strong><small>${escapeHtml(track.title)}</small></span>
                    </button>`;
                const resumeImg = stage.querySelector('.resume-thumb');
                attachThumbnailFallback(resumeImg, track.videoId);
                stage.querySelector('.resume-poster').addEventListener('click', () => playTrack(track));
                if (DOM.nowPlayingTitle) DOM.nowPlayingTitle.textContent = track.title;
                if (DOM.fsNowPlaying) DOM.fsNowPlaying.textContent = track.title;
                if (DOM.nowPlayingSub) DOM.nowPlayingSub.textContent = 'Last played · tap the player to resume';
                syncExperienceModeUI();
            }
        });

        // Sonora presence heartbeat to ensure no secondary mini players are created in other tabs or frames
        setInterval(() => {
            if (STATE.activeTrack && STATE.activeVideoId) {
                try {
                    localStorage.setItem('sonora_tab_active', String(Date.now()));
                } catch {}
            }
        }, 2000);
        window.addEventListener('beforeunload', () => {
            try {
                localStorage.removeItem('sonora_tab_active');
            } catch {}
        });
    });
})();
