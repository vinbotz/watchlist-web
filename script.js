const supabaseUrl = "https://vzvfredfasdmwfevybhw.supabase.co";
const supabaseKey = "sb_publishable_JaqcVnuykMjOQ5yDNeg4bw_LNfvr19W";
const tmdbKey = "bda1a29e702d077647db551668d3d4a9";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

loadMovies();

document.getElementById("movieInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchMovie();
  }
});

async function searchMovie() {
  const query = document.getElementById("movieInput").value.trim();

  if (!query) {
    showPopup("Masukkan judul film");
    return;
  }

  document.getElementById("results").innerHTML = "Searching...";

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      document.getElementById("results").innerHTML =
        "<p>Tidak ada film ditemukan</p>";
      return;
    }

    showResults(data.results);
  } catch (err) {
    console.log("SEARCH ERROR:", err);
  }
}

function showResults(movies) {
  const container = document.getElementById("results");

  container.innerHTML = "";

  movies.slice(0, 12).forEach((movie) => {
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://placehold.co/300x450?text=No+Image";

    const year = movie.release_date
      ? movie.release_date.split("-")[0]
      : "Unknown";

    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `

<img src="${poster}">
<h3>${movie.title}</h3>
<p>${year}</p>

`;

    const btnWrapper = document.createElement("div");
    btnWrapper.className = "movie-card-buttons";

    const addBtn = document.createElement("button");
    addBtn.innerText = "Tambah";

    addBtn.addEventListener("click", () => {
      saveMovie(movie.title, poster, year, movie.id);
    });

    const trailerBtn = document.createElement("button");
    trailerBtn.innerText = "Trailer";

    trailerBtn.addEventListener("click", () => {
      showTrailer(movie.id);
    });

    btnWrapper.appendChild(addBtn);
    btnWrapper.appendChild(trailerBtn);
    card.appendChild(btnWrapper);

    container.appendChild(card);
  });
}

async function saveMovie(title, poster, year, id) {
  try {
    const { data: existing } = await supabaseClient
      .from("movies")
      .select("tmdb_id")
      .eq("tmdb_id", id);

    if (existing.length > 0) {
      showPopup("Film sudah ada di watchlist");
      return;
    }

    const { error } = await supabaseClient.from("movies").insert([
      {
        title: title,
        poster: poster,
        year: year,
        tmdb_id: id,
      },
    ]);

    if (error) {
      console.log("INSERT ERROR:", error);
      showPopup("Gagal menyimpan film");
      return;
    }

    showPopup("Film berhasil ditambahkan");

    loadMovies();
  } catch (err) {
    console.log("SAVE ERROR:", err);
  }
}

function showPopup(message) {
  document.getElementById("popupMessage").innerText = message;

  document.getElementById("popup").style.display = "flex";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

async function loadMovies() {
  const { data, error } = await supabaseClient
    .from("movies")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.log("LOAD ERROR:", error);
    return;
  }

  const container = document.getElementById("movies");

  container.innerHTML = "";

  data.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    card.innerHTML = `

<img src="${movie.poster}">
<h3>${movie.title}</h3>
<p>${movie.year}</p>

`;

    const btnWrapper = document.createElement("div");
    btnWrapper.className = "movie-card-buttons";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Hapus";

    deleteBtn.addEventListener("click", () => {
      openDeleteModal(movie.id);
    });

    btnWrapper.appendChild(deleteBtn);
    card.appendChild(btnWrapper);

    container.appendChild(card);
  });
}

async function deleteMovie(id) {
  if (showPopup("Hapus film ini?")) return;

  const { error } = await supabaseClient.from("movies").delete().eq("id", id);

  if (error) {
    console.log("DELETE ERROR:", error);
  } else {
    loadMovies();
  }
}

let movieToDelete = null;

function openDeleteModal(id) {
  movieToDelete = id;

  document.getElementById("deleteModal").style.display = "flex";
}

function closeDeleteModal() {
  movieToDelete = null;

  document.getElementById("deleteModal").style.display = "none";
}

document.getElementById("confirmDelete").addEventListener("click", async () => {
  if (!movieToDelete) return;

  const { error } = await supabaseClient
    .from("movies")
    .delete()
    .eq("id", movieToDelete);

  if (error) {
    showPopup("Gagal menghapus film");
  } else {
    showPopup("Film berhasil dihapus");

    loadMovies();
  }

  closeDeleteModal();
});

async function showTrailer(id) {
  const url = `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${tmdbKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const trailer = data.results.find((v) => v.type === "Trailer");

    if (trailer) {
      document.getElementById("trailer").innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${trailer.key}"
          allowfullscreen
          title="Trailer">
        </iframe>
      `;

      window.scrollTo({
        top: document.getElementById("trailer").offsetTop,
        behavior: "smooth",
      });
    } else {
      showPopup("Trailer tidak ditemukan");
    }
  } catch (err) {
    console.log("TRAILER ERROR:", err);
  }
}

async function randomMovie() {
  const { data, error } = await supabaseClient.from("movies").select("*");

  if (error) {
    console.log(error);
    return;
  }

  if (data.length === 0) {
    showPopup("Watchlist kosong");
    return;
  }

  const random = data[Math.floor(Math.random() * data.length)];

  showPopup("🎬 Rekomendasi malam ini:\n" + random.title);
}
