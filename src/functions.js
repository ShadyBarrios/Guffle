/*
/////////////////////
// IMPORTANT TYPES //
/////////////////////
*/

/**
 * Genres object from Apple API
 * @typedef {Object} Genres
 * @property {string} id - Genre ID
 * @property {Object} attributes - Genre attributes
 * @property {string} attributes.name - Genre name
 */

/**f
 * Songs object from Apple API
 * @typedef {Object} Songs
 * @property {string} id - Song ID
 * @property {Object} attributes - Song attributes
 * @property {string} attributes.name - Song name
 * @property {string} attributes.artistName - Song artist name
 * @property {string[]} attributes.genreNames - Song genre names
 * @property {Object} relationships - Song relationships
 * @property {Object} relationships.genres - Song genre data
 * @property {Genres[]} relationships.genres.data - Song genre data
 */

/**
 * LibraryPlaylists object from Apple API
 * @typedef {Object} LibraryPlaylists
 * @property {string} id - Playlist ID
 * @property {Object} attributes - Playlist attributes
 * @property {string} attributes.name - Playlist name
 */

/**
 * LibrarySongs object from Apple API
 * @typedef {Object} LibrarySongs
 * @property {Object} attributes - Song attributes
 * @property {Object} attributes.playParams - Song play parameters
 * @property {string} attributes.playParams.catalogId - Song catalog ID
 */

/** 
 * Lighweight class only containing vital Song information
 * */
export class Song {
    /**
     * @param {string} id - Catalog ID
     * @param {string[]} genres - array of genre IDs
     * @param {string[]} subgenres - array of subgenres names
     */
    constructor(id, genres, subgenres) {
        // check that we have good vars (note that isLiked is bool, so we use typeof)
        if (!id || !genres || !subgenres) {
            console.error("Song constructor var's are undefined");
            return;
        }

        this.id = id;
        this.genres = genres;
        this.subgenres = subgenres;
      }
}

/*
///////////////////////////////////////////
// GLOBAL VARIABLES AND HELPER FUNCTIONS //
///////////////////////////////////////////
*/

const developerToken = "eyJhbGciOiJFUzI1NiIsImtpZCI6Iks3N003Q0Q3VVciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiIyUTJLTUo1Mjk1IiwiaWF0IjoxNzM4MTU1MDUxLCJleHAiOjE3NTM5MzIwNTF9.wUBzRPzu2MJ0QYgLUm8XpOXgnpcySWqoSZzLkmUGHKVIoKy77vJfUpzmgE-bp-m8FVDAHj8O2bzjqxmB8qdLxw";
let userToken = "AlLe4L3iXChGjyf4RQXdJ2Kqm6Y9MqN2b/ArL1owtg4TQm/DHcymgUxCh4y42MXK6GAysfrUwHpAzScihOWCyFO86M7d4WOZjpJaOLQHN+mJoZEoSa2pk38ACwZ5BSJvqdlBHS8OL56yGR6XVtjcG1b2GLPJMKe0+PNbOucFucvS2sHYsgx6YHTI0wnPLbdAIrXWtNEV8j/VvbcfJsvA3o8JbbupUdhDNE0kAg2FCIoElPHVKQ==";

/**
 * [name] = id if exists
 */
let genreDictionary = {};

/**
 * [name] = 1 if exists
 */
let subgenreDictionary = {};

/**
 * Global helper functions
 */
export class GlobalFunctions{
    /**
     * Adds genres to the genre dictionary if not already included (dictionary[name] = id)
     * @param {Genres[]} genres - array of Genres objects
     */
    static async add_to_genre_dictionary(genres){
        genres.forEach(genre => {
            genreDictionary[genre.attributes.name] = genre.id;
        })
    }

    /**
     * Adds subgenres to the subgenre dictionary if not already included (dictionary[name] = 1 if exists)
     * @param {string[]} subgenres - array of subgenre names
     */
    static async add_to_subgenre_dictionary(subgenres){
        subgenres.forEach(subgenre => {
            subgenreDictionary[subgenre] = 1;
        })
    }

    /**
     * Returns genre ID from genreDictionary given genre name
     * @param {string} genre_name - looked up in genreDictionary
     * @returns {Promise<string>} genre ID
     */
    static async get_genre_id(genre_name){
        const id = genreDictionary[genre_name];
        console.log("Searching dictionary for ID of " + genre_name);
        if(id == undefined){
            console.error(genre_name + " is not in genre dictionary.")
            return -1;
        }
        return id;
    }

    /**
     * Partitioner splits songIDs into chunks of 300 for Apple API requests
     * @param {string[]} songIDs 
     * @returns {string[][]} array of songID partitions
     */
    static async songIDs_partitioner(songIDs){
        const songIDsPartitions = [];
        while (songIDs.length) {
            songIDsPartitions.push(songIDs.splice(0, 300)); 
        }
        return songIDsPartitions;
    }

    /**
     * Bloat-reducing helper function for fetch requests
     * @returns headers for fetch requests
     */
    static get_headers(){
        return {
            "Authorization": 'Bearer ' + developerToken,
            "Music-User-Token": userToken
        }
    }
}

/*
////////////////////////////////////////////////
// FUNCTIONS THAT COMMUNICATE WITH INDEX.HTML //
////////////////////////////////////////////////
*/

/**
 * Functions used to communicate with index.html
 */
export class Displayer{
    /**
     * Displays user's playlists in the playlists <p>
     */
    static async display_user_playlists(){
        let playlists = await PlaylistDataFetchers.get_user_playlists();
        let output = "100 or less of your playlists: \n";
        playlists.forEach((playlist, index) => {
            output += "\n" + (index + 1) + ". " + (playlist.attributes.name) + " | ID: " + (playlist.id);
        });
        document.getElementById("playlists").innerText = output;
    }

    /**
     * Displays user's recently played songs in the recently_played <p>
     */
    static async display_user_recently_played(){
        let songs = await SongDataFetchers.get_user_recently_played();
        let output = "10 of your most recently played songs: \n";
        songs.forEach((song, index) => {
            output += "\n" + (index + 1) + ". " + (song.attributes.name) + " by " + (song.attributes.artistName) + (" |-|-| Genres + Subgenres: ") + (song.attributes.genreNames);
        });
        document.getElementById("recently_played").innerText = output;
    }

    /**
     * Displays user's genre dictionary in the genre_dictionary <p>
     */
    static async display_genre_dictionary(){
        let output = "Genres in your recently played songs: \n";
        for(const genre in genreDictionary){
            output += "\n" + genre + " | " + genreDictionary[genre];
        }
        document.getElementById("genre_dictionary").innerText = output;
    }

    /**
     * Displays user's subgenre dictionary in the subgenre_dictionary <p>
     */
    static async display_subgenre_dictionary(){
        let output = "Subgenres in your recently played songs: \n";
        for(const subgenre in subgenreDictionary){
            output += "\n" + subgenre;
        }
        document.getElementById("subgenre_dictionary").innerText = output;
    }

    /**
     * Displays user's genre ID in the genre_id <p>
     */
    static async display_genre_id(){
        const genre_name = document.getElementById("input_genre_name").value;
        const id = await GlobalFunctions.get_genre_id(genre_name);
        let output = "ID for genre: " + genre_name + " = " + id;
        document.getElementById("genre_id").innerText = output;
    }

    /**
     * Displays user's genre-based song recommendation in the genre_recommendation <p>
     */
    static async display_genre_song_recommendation(){
        const genre = document.getElementById("input_genre").value;
        const song = await Recommender.get_genre_song_recommendation(genre);
        if(song == undefined){
            document.getElementById("genre_recommendation").innerText = "None found";
        }
        song_name = song.attributes.name;
        song_artist = song.attributes.artistName;
        song_genres = song.attributes.genreNames;
        output = "Recommended " + genre + " song: " + song_name + " by " + song_artist + " | Genres: " + song_genres;
        document.getElementById("genre_recommendation").innerText = output;
    }

    /**
     * Displays user's song count in a playlist given playlist id
     */
    static async display_playlist_song_count(){
        const playlist_id = document.getElementById("input_playlist_id").value;
        const songs = await SongDataFetchers.get_all_user_playlist_song_IDs(playlist_id);
        document.getElementById("playlist_songs_count").innerText = "Song count: " + songs.length;
    }

    /**
     * Displays user's songs in a playlist given playlist id
     */
    static async display_playlist_songs(){
        const playlist_id = document.getElementById("input_playlist_id_2").value;
        const songIDs = await SongDataFetchers.get_all_user_playlist_song_IDs(playlist_id);
        const songs = await SongDataFetchers.get_user_songs(songIDs);
        let output = "";

        for(let i = 0; i < songs.length; i++){
            output += (i + 1) + ". Catalog ID: " + songs[i].id + " | Genres: " + songs[i].genres + " | Subgenres: " + songs[i].subgenres + "\n";
        }

        document.getElementById("playlist_songs_IDs").innerText = output;
    }

    /**
     * Displays user's song count from all playlists
     */
    static async display_all_playlists_song_count(){
        const songs = await SongDataFetchers.get_all_user_playlists_song_IDs();
        document.getElementById("all_playlists_songs_count").innerText = "Song count: " + songs.length;
    }

    /**
     * Displays user's library song count
     */
    static async display_library_song_count(){
        const songs = await SongDataFetchers.get_all_user_library_song_IDs();
        document.getElementById("library_songs_count").innerText = "Song count: " + songs.length;
    }


    /**
     * Displays user's song count in (library + playlists), no duplicates
     */
    static async display_all_songs_count(){
        const songs = await SongDataFetchers.get_all_user_song_IDs();
        document.getElementById("all_songs_count").innerText = "Song count: " + songs.length;
    }

    /**
     * Displays user's songs in (library + playlists), no duplicates
     */
    static async display_all_songs(){
        const songIDs = await SongDataFetchers.get_all_user_song_IDs();
        const songs = await SongDataFetchers.get_user_songs(songIDs);
        let output = "";

        for(let i = 0; i < songs.length; i++){
            output += (i + 1) + ". Catalog ID: " + songs[i].id + " | Genres: " + songs[i].genres + " | Subgenres: " + songs[i].subgenres + "\n";
        }

        document.getElementById("all_songs").innerText = output;
    }
}

/*
///////////////////////////////////////////////////////////////
// RETRIEVAL FUNCTIONS THAT COMMUNICATE WITH APPLE MUSIC API //
///////////////////////////////////////////////////////////////
*/

/**
 * Functions to fetch users' song data
 */
export class SongDataFetchers{
    /**
     * Returns array of user's 10 most recently played songs.
     * Updates Genre and Subgenre dictionaries.
     * @returns {Promise<Songs>} array of Songs objects
     */ 
    static async get_user_recently_played(){
        const url = "https://api.music.apple.com/v1/me/recent/played/tracks?limit=10";
        console.log("Retrieving recently played songs...")
        try{
            const response = await fetch(url, {
                headers: GlobalFunctions.get_headers()
            });

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            for(let i = 0; i < data.data.length; i++){
                let genres = await GenreDataFetchers.get_genres(data.data[i].id);
                GlobalFunctions.add_to_genre_dictionary(genres);
                GlobalFunctions.add_to_subgenre_dictionary(data.data[i].attributes.genreNames);
            }

            return data.data;
        } catch(error){
            console.error("Error fetching top songs: ", error);
        }
    }

    /**
     * Returns array containing all songs found in user's library and playlists.
     * @returns {Promise<Song[]>} array of Song objects
     */
    static async get_all_user_songs(userLink){
        userToken = userLink; // update user link

        const songIDs = await SongDataFetchers.get_all_user_song_IDs();
        const songs = await SongDataFetchers.get_user_songs(songIDs);
        return songs;
    }

    /**
     * Returns array containing all songs given song catalog ID array
     * @param {string[]} songIDs - array of song catalog IDs
     * @returns {Promise<Song[]>} array of Song objects
     */
    static async get_user_songs(songIDs){
        let url = "https://api.music.apple.com/v1/catalog/us/songs?include=genres&ids=";
        const partitions = await GlobalFunctions.songIDs_partitioner(songIDs);
        let songs = [];
        console.log("Retrieving user songs...");
        try{
            for(let i = 0; i < partitions.length; i++){
                const ids = partitions[i].join(",");

                const response = await fetch(url + ids, {
                    headers: GlobalFunctions.get_headers()
                });

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        // Retry after a delay (see below)
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                        i--;
                        continue; // Retry
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();

                for(let i = 0; i < data.data.length; i++){
                    await GlobalFunctions.add_to_genre_dictionary(data.data[i].relationships.genres.data);
                    await GlobalFunctions.add_to_subgenre_dictionary(data.data[i].attributes.genreNames);
                    songs.push(new Song(data.data[i].id, data.data[i].relationships.genres.data.map(genre => genre.id), data.data[i].attributes.genreNames));
                }
            }
            return [...new Set(songs)];
        }catch(error){
            console.error("Error fetching songs: ", error);
        }
    }

    /** 
     * Returns array containing all songs IDs found in user's library and playlists.
     * @returns {Promise<string[]>} array of song catalog IDs
     */
    static async get_all_user_song_IDs(){
        // get all songs from the library section
        const librarySongIDs = await SongDataFetchers.get_all_user_library_song_IDs();
        const playlistSongIDs = await SongDataFetchers.get_all_user_playlists_song_IDs();

        // union array with no duplicates
        const allSongIDs = await [...new Set([...librarySongIDs, ...playlistSongIDs])];
        
        return allSongIDs;
    }

    /**
     * Returns all song catalog ID's from all user's playlists
     * @param {string} playlist_id - LibraryPlaylists ID
     * @returns {string[]} array of song catalog IDs
     */
    static async get_all_user_playlists_song_IDs(){
        const playlistIDs = await PlaylistDataFetchers.get_all_user_playlist_IDs();
        let playlistSongIDs = [];
        for(let i = 0; i < playlistIDs.length; i++){
            playlistSongIDs.push(await SongDataFetchers.get_all_user_playlist_song_IDs(playlistIDs[i]));
        }
        return [...new Set(playlistSongIDs.flat())];
    }

    /**
     * Returns all song catalog ID's in a user's playlist
     * @param {string} playlist_id - LibraryPlaylists ID
     * @returns {string[]} array of song catalog IDs
     */
    static async get_all_user_playlist_song_IDs(playlist_id){
        const url = "https://api.music.apple.com/v1/me/library/playlists/" + playlist_id + "/tracks?limit=100&offset=";
        let offset = 0;
        let accumulatedSongIDs = [];
        console.log("Retrieving user playlist songs' IDs...");

        try{
            await SongDataFetchers.get_user_playlist_song_IDs(url, offset, accumulatedSongIDs);
            return [...new Set(accumulatedSongIDs)];
        }catch(error){
            console.error("Error fetching user playlist songs' IDs: ", error);
            return [];
        }
    }

    /**
     * Return at most 100 song catalog IDs from a library playlist, based on offset
     * @param {string} url - Apple API URL
     * @param {number} offset - Apple API offset
     * @param {string[]} accumulatedSongIDs - array of song catalog IDs
     * @returns {Promise<string[]>} accumulatedSongIDs
     */
    static async get_user_playlist_song_IDs(url, offset, accumulatedSongIDs){
        try{
            while(true){
                const response = await fetch(url + offset, {
                    headers: GlobalFunctions.get_headers()
                });

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        // Retry after a delay (see below)
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                        continue; // Retry
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();
                
                /** @type {LibrarySongs[]} */ 
                data.data.forEach(song=>accumulatedSongIDs.push(song.attributes.playParams?.catalogId));
                
                if(data.next){
                    offset += 100;
                    continue;
                }
                else{
                    return [...new Set(accumulatedSongIDs)];
                }
            }
        }catch(error){  
            console.error("Error fetching user playlist songs' IDs: ", error);
            return [];
        }
    }

    /**
     * Returns array of all song catalog IDs in user's library
     * @returns {Promise<string[]>} array of song catalog IDs
     */
    static async get_all_user_library_song_IDs(){
        const url = "https://api.music.apple.com/v1/me/library/songs?limit=100";
        console.log("Retrieving user library songs' IDs...");
        let accumulatedSongIDs = [];
        try{
            await SongDataFetchers.get_user_library_song_IDs(url, accumulatedSongIDs);
            return [...new Set(accumulatedSongIDs)];
        }catch(error){
            console.error("Error fetching user library songs' IDs: ", error);
            return [];
        }
    }

    /**
     * Returns array of song catalog IDs in user's library page
     * @param {string} url - Apple API URL (used for pagination)
     * @param {string[]} accumulatedSongIDs - array of song catalog IDs
     * @returns {Promise<string[]>} accumulatedSongIDs
     */
    static async get_user_library_song_IDs(url, accumulatedSongIDs){
        try{
            while(true){
                const response = await fetch(url, {
                    headers: GlobalFunctions.get_headers()
                });

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        // Retry after a delay (see below)
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                        continue; // Retry
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();

                /** @type {LibrarySongs[]} */ 
                data.data.forEach(song=>accumulatedSongIDs.push(song.attributes.playParams?.catalogId));

                if(data.next){
                    url = "https://api.music.apple.com" + data.next + "&limit=100";
                    continue;
                }
                else{
                    return [...new Set(accumulatedSongIDs)];
                }
            }
        }catch(error){
            console.error("Error fetching user library songs' IDs: ", error);
            return [];
        }
    }
}

/**
 * Functions to fetch users' playlist data
 */
export class PlaylistDataFetchers{
    /**
     * Returns array of user's playlists - maximum size is 100 playlists
     * @returns {Promise<LibraryPlaylists[]>} array of LibraryPlaylists objects
     */
    static async get_user_playlists(){
        const url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
        console.log("Retrieving playlists...")
        try{
            const response = await fetch(url, {
                headers:{
                    "Authorization": 'Bearer ' + developerToken,
                    "Music-User-Token": userToken
                }
            });

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            
            return data.data;
        } catch(error){
            console.error("Error fetching playlists: ", error);
        }
    }

    /**
     * Returns array of all playlist IDs in user's library
     * @returns {Promise<string[]>} array of LibraryPlaylists IDs
     */
    static async get_all_user_playlist_IDs(){
        let url = "https://api.music.apple.com/v1/me/library/playlists?limit=100";
        console.log("Retrieving user library playlist IDs...");
        let accumulatedPlaylistIDs = [];
        try{
            await PlaylistDataFetchers.get_user_playlist_IDs(url, accumulatedPlaylistIDs);
            return accumulatedPlaylistIDs;
        }catch(error){
            console.error("Error fetching user library playlist IDs: ", error);
            return [];
        }
    }

    /**
     * Returns array of all playlist IDs in user's library page
     * @param {string} url - Apple API URL (used for pagination)
     * @param {string[]} accumulatedPlaylistIDs - array of LibraryPlaylists IDs
     * @returns {Promise<string[]>} aaccumulatedPlaylistIDs
     */
    static async get_user_playlist_IDs(url, accumulatedPlaylistIDs){
        try{
            while(true){
                const response = await fetch(url, {
                    headers: GlobalFunctions.get_headers()
                });

                if(!response.ok){
                    if (response.status === 504) {
                        console.error("Gateway Timeout (504) - Retrying...");
                        // Retry after a delay (see below)
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                        continue; // Retry
                    }else {
                        throw new Error("HTTP Error! Status: " + response.status);
                    }
                }

                const data = await response.json();

                /** @type {LibraryPlaylists[]} */ 
                data.data.forEach(playlist=>accumulatedPlaylistIDs.push(playlist.id));
            
                if(data.next){
                    url = "https://api.music.apple.com" + data.next + "&limit=100";
                    continue;
                }
                else{
                    return [...new Set(accumulatedPlaylistIDs)];
                }
            }
        }catch(error){
            console.error("Error fetching user library playlist IDs: ", error);
            return [];
        }
    }
}

/**
 * Functions to fetch users' playlist data
 */
export class GenreDataFetchers{
    /**
     * Returns array of genres for a song
     * @param {string} song_id - Catalog ID of song
     * @returns {Promise<Genres>} array of Genres objects
     */
    static async get_genres(song_id){
        let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id + "?include=genres";
        console.log("Retrieving genres for: " + song_id);
        try{
            const response = await fetch(url, {
                headers: GlobalFunctions.get_headers()
            });

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            return data.data[0].relationships.genres.data;
        }catch(error){
            console.error("Error fetching genres: ", error);
        }
    }

    /**
     * Returns array of subgenre names for a song
     * @param {string} song_id 
     * @returns {string[]} array of subgenre names
     */
    static async get_subgenres(song_id){
        let url = "https://api.music.apple.com/v1/catalog/us/songs/" + song_id;
        console.log("Retrieving subgenres for: " + song_id);
        try{
            const response = await fetch(url, {
                headers: GlobalFunctions.get_headers()
            });

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            return data.data[0].attributes.genreNames;
        }
        catch(error){
            console.error("Error fetching subgenres: ", error);
        }
    }
}

export class Recommender{
    /**
     * Returns a random song recommendation given a genre name from Apple Music charts
     * @param {string} genre_name - looked up in genreDictionary
     * @returns {Promise<Songs>} Apple API Songs object
     */
    static async get_genre_song_recommendation(genre_name){
        const id = genreDictionary[genre_name];
        let url = "https://api.music.apple.com/v1/catalog/us/charts?genre=" + id + "&types=songs&limit=25";
        console.log("Retrieving recommendations from " + genre_name);
        
        try{
            if(id == undefined) throw new Error("Genre input is not valid.");

            const response = await fetch(url, {
                headers: GlobalFunctions.get_headers()
            });

            if(!response.ok) throw new Error("HTTP Error! Status: " + response.status);

            const data = await response.json();
            const songs = data.results.songs[0].data;
            if(songs.length == 0){
                console.error("No results");
            }
            const song = songs[Math.floor(Math.random() * songs.length)];
            return song;
        }catch(error){
            console.error("Error fetching genres: ", error);
        }
    }
}