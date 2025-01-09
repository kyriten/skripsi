import React, { useState, useEffect } from "react";
import axios from "axios";
import "font-awesome/css/font-awesome.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [currentAirQuality, setCurrentAirQuality] = useState({});
  const [forecast, setForecast] = useState({});
  const [specificDatePrediction, setSpecificDatePrediction] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPollutant, setSelectedPollutant] = useState(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchAirQuality();
    fetchForecast();
    const interval = setInterval(() => {
      fetchAirQuality();
      fetchForecast();
    }, 3600000); // Update every hour
    return () => clearInterval(interval);
  }, []);

  const getColorByISPU = (ispu) => {
    if (ispu <= 50) return "#4CAF50";
    if (ispu <= 100) return "#2196F3";
    if (ispu <= 200) return "#FF9800";
    if (ispu <= 300) return "#F44336";
    if (ispu > 300) return "#000000";
    return "#FFFFFF";
  };

  const getLevelByISPU = (ispu) => {
    if (ispu <= 50) return "Baik";
    if (ispu <= 100) return "Sedang";
    if (ispu <= 200) return "Tidak Sehat";
    if (ispu <= 300) return "Sangat Tidak Sehat";
    if (ispu > 300) return "Berbahaya";
    return "Tidak Terdefinisi";
  };

  const fetchAirQuality = async () => {
    try {
      const { data } = await axios.get("/air-quality");
      setCurrentAirQuality(data);
    } catch (error) {
      console.error("Error fetching air quality data", error);
    }
  };

  const fetchForecast = async () => {
    try {
      const { data } = await axios.get("/forecast");
      console.log("Forecast API Response:", data);
      setForecast(data);
    } catch (error) {
      console.error("Error fetching forecast data", error);
    }
  };

  const getPrediction = async () => {
    if (!selectedDate) {
      alert("Please select a date before requesting prediction.");
      return;
    }

    setLoading(true);
    try {
      const formattedDate = new Date(selectedDate).toISOString().split("T")[0];

      const { data } = await axios.get(`/predict/${formattedDate}`);
      console.log("API Response:", data);

      // Langsung gunakan data jika respons API berupa array
      setSpecificDatePrediction(
        data.length > 0 ? data : "No forecast available for this date."
      );
    } catch (error) {
      setSpecificDatePrediction(
        error.response?.data?.message || "Error fetching prediction."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const handleCardClick = (pollutant, airQualityData) => {
    setSelectedPollutant({ pollutant, airQualityData });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPollutant(null); 
  };

  return (
    <div className="container">
      <header className="row d-flex justify-content-center justify-content-md-between align-items-start my-4 text-center">
        <div className="col-md-6 text-md-start">
          <h3 className="mb-2">Kualitas Udara di Kota Bogor</h3>
          <p className="text-muted" style={{ fontSize: "12px" }}>
            Indeks kualitas udara di Kota Bogor
            <span className="text-muted mx-1">•</span>
            {currentTime.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-sm my-2 d-md-block d-none"
            style={{ backgroundColor: "#7E99A3", color: "white" }}
            disabled={loading}>
            {loading ? "Loading..." : "Prediksi"}
          </button>
        </div>

        <div className="col-8 col-md-5 col-lg-3">
          <div className="card-body">
            {Object.keys(currentAirQuality).length === 0 ? (
              <p
                className="text-muted text-center animate-fade"
                style={{ fontSize: "10px" }}>
                Sedang mengolah model...
              </p>
            ) : (
              Object.keys(currentAirQuality)
                .map((pollutant) => {
                  const airQualityData = currentAirQuality[pollutant];
                  return {
                    pollutant,
                    timestamp: airQualityData.timestamp,
                    prediction: airQualityData.prediction,
                  };
                })
                .sort((a, b) => b.prediction - a.prediction)
                .slice(0, 1)
                .map(({ pollutant, timestamp, prediction }) => {
                  const color = getColorByISPU(prediction);
                  const level = getLevelByISPU(prediction);

                  return (
                    <div key={pollutant} className="mb-3">
                      <div
                        className="card"
                        style={{
                          border: "0px",
                          backgroundColor: color,
                          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                        }}>
                        <div className="card-body text-start text-white pb-0">
                          <div className="row d-flex justify-content-between">
                            <div className="col-md-6">
                              <p
                                className="fw-bold mb-0"
                                style={{ fontSize: "12px" }}>
                                {level}
                              </p>
                            </div>
                          </div>

                          <hr
                            className="my-1"
                            style={{
                              backgroundColor: "#FFFFFF",
                              borderWidth: "1px",
                              borderRadius: "5px",
                            }}
                          />

                          <div className="row d-flex justify-content-between">
                            <div className="col-6 mb-0">
                              <p className="mb-0" style={{ fontSize: "12px" }}>
                                Polutan Utama:{" "}
                                <span className="fw-bold">{pollutant}</span>
                              </p>
                              {pollutant === "CO" ? (
                                <p style={{ fontSize: "10px" }}>
                                  Karbon Monoksida
                                </p>
                              ) : pollutant === "HC" ? (
                                <p style={{ fontSize: "10px" }}>Hidrokarbon</p>
                              ) : pollutant === "NO2" ? (
                                <p style={{ fontSize: "10px" }}>
                                  Nitrogen Dioksida
                                </p>
                              ) : pollutant === "O3" ? (
                                <p style={{ fontSize: "10px" }}>Ozon</p>
                              ) : pollutant === "PM10" ? (
                                <p style={{ fontSize: "10px" }}>
                                  Materi Partikulat di bawah 10 mikron
                                </p>
                              ) : pollutant === "PM2.5" ? (
                                <p style={{ fontSize: "10px" }}>
                                  Partikel halus di bawah 2,5 mikron
                                </p>
                              ) : pollutant === "SO2" ? (
                                <p style={{ fontSize: "10px" }}>
                                  Sulfur Dioksida
                                </p>
                              ) : (
                                <p
                                  className="text-muted"
                                  style={{ fontSize: "10px" }}>
                                  Polutan tidak terdefinisi
                                </p>
                              )}
                            </div>
                            <div className="col-6 text-end mb-0">
                              <p
                                className="fw-bold"
                                style={{ fontSize: "12px" }}>
                                {prediction} µg/m³
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          className="card-footer text-start text-dark"
                          style={{
                            fontSize: "10px",
                            backgroundColor: "#F3F5F7",
                          }}>
                          Diperbarui: <strong>{formatDate(timestamp)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        <div className="col-md-6 d-flex justify-content-center">
          <button
            onClick={() => setShowModal(true)}
            className="w-50 btn btn-sm my-2 d-block d-md-none"
            disabled={loading}
            style={{ backgroundColor: "#7E99A3", color: "white" }}>
            {loading ? "Loading..." : "Prediksi"}
          </button>
        </div>
      </header>

      <section className="row g-5 d-flex justify-content-between p-2 pt-4">
        <section className="my-2 col-md-6 col-lg-6">
          <div className="row">
            <div className="card p-0">
              <h6 className="card-title text-start mt-3 mb-0 mx-3">
                Polutan Udara Hari Ini
              </h6>
              <div className="card-body mt-0">
                <div className="row">
                  {Object.keys(currentAirQuality).length === 0 ? (
                    <p
                      className="text-muted text-center animate-fade"
                      style={{ fontSize: "10px" }}>
                      Sedang mengolah model...
                    </p>
                  ) : (
                    Object.keys(currentAirQuality).map((pollutant) => {
                      const airQualityData = currentAirQuality[pollutant];
                      const { prediction } = airQualityData;
                      const adjustedPrediction =
                        prediction <= 0 ? 0 : prediction;
                      const color = getColorByISPU(prediction);

                      return (
                        <div key={pollutant} className="col-sm-6 mb-3">
                          <div
                            className="card border-0"
                            style={{
                              backgroundColor: "#F3F5F7",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              handleCardClick(pollutant, airQualityData)
                            }>
                            <div
                              className="card-body text-start pb-0"
                              style={{
                                transition:
                                  "transform 0.3s ease, box-shadow 0.3s ease",
                                boxShadow: "0 0px 4px rgba(0, 0, 0, 0.1)",
                                backgroundColor: "#F3F5F7",
                                borderRadius: "5px",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.05)";
                                e.target.style.boxShadow =
                                  "0 4px 10px rgba(0, 0, 0, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                                e.target.style.boxShadow =
                                  "0 2px 4px rgba(0, 0, 0, 0.1)";
                              }}>
                              <h6
                                className="card-title mb-0"
                                style={{ pointerEvents: "none" }}>
                                {pollutant}
                              </h6>
                              <div
                                className="card-text mt-1"
                                style={{ pointerEvents: "none" }}>
                                {pollutant === "CO" ? (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Karbon Monoksida
                                  </p>
                                ) : pollutant === "HC" ? (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Hidrokarbon
                                  </p>
                                ) : pollutant === "NO2" ? (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Nitrogen Dioksida
                                  </p>
                                ) : pollutant === "O3" ? (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Ozon
                                  </p>
                                ) : pollutant === "PM10" ? (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Materi Partikulat di bawah 10 mikron
                                  </p>
                                ) : pollutant === "PM2.5" ? (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Partikel halus di bawah 2,5 mikron
                                  </p>
                                ) : pollutant === "SO2" ? (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Sulfur Dioksida
                                  </p>
                                ) : (
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "10px" }}>
                                    Polutan tidak terdefinisi
                                  </p>
                                )}
                              </div>
                              <div
                                className="card-text mb-0"
                                style={{ pointerEvents: "none" }}>
                                <p
                                  class="badge"
                                  style={{ backgroundColor: color }}>
                                  {adjustedPrediction}
                                </p>
                                <span
                                  className="ms-2"
                                  style={{ fontSize: "10px" }}>
                                  µg/m³
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {showModal && selectedPollutant && (
              <div
                className="modal fade show"
                style={{ display: "block" }}
                tabIndex="-1"
                aria-labelledby="pollutantModalLabel"
                aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                  <div className="modal-content">
                    <div className="modal-body">
                      <div className="d-flex justify-content-between mb-3">
                        <div className="mt-4">
                          <h5 className="modal-title" id="pollutantModalLabel">
                            {selectedPollutant.pollutant}
                          </h5>
                          {selectedPollutant.pollutant === "CO" ? (
                            <p style={{ fontSize: "14px" }}>Karbon Monoksida</p>
                          ) : selectedPollutant.pollutant === "HC" ? (
                            <p style={{ fontSize: "14px" }}>Hidrokarbon</p>
                          ) : selectedPollutant.pollutant === "NO2" ? (
                            <p style={{ fontSize: "10px" }}>
                              Nitrogen Dioksida
                            </p>
                          ) : selectedPollutant.pollutant === "O3" ? (
                            <p style={{ fontSize: "14px" }}>Ozon</p>
                          ) : selectedPollutant.pollutant === "PM10" ? (
                            <p style={{ fontSize: "14px" }}>
                              Materi Partikulat di bawah 10 mikron
                            </p>
                          ) : selectedPollutant.pollutant === "PM2.5" ? (
                            <p style={{ fontSize: "14px" }}>
                              Partikel halus di bawah 2,5 mikron
                            </p>
                          ) : selectedPollutant.pollutant === "SO2" ? (
                            <p style={{ fontSize: "14px" }}>Sulfur Dioksida</p>
                          ) : (
                            <p
                              className="text-muted"
                              style={{ fontSize: "14px" }}>
                              Polutan tidak terdefinisi
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-close mt-1"
                          data-bs-dismiss="modal"
                          aria-label="Close"
                          onClick={handleCloseModal}></button>
                      </div>

                      <p className="mb-1">
                        <strong>
                          Apa itu {selectedPollutant.pollutant} ?{" "}
                        </strong>
                      </p>
                      <p>
                        {" "}
                        {selectedPollutant.pollutant === "CO"
                          ? "Karbon Monoksida adalah gas yang tidak berwarna, tidak berbau, dan tidak berasa, namun sangat beracun dan berbahaya bagi tubuh. CO dihasilkan oleh proses pembakaran yang tidak sempurna di dalam mesin."
                          : selectedPollutant.pollutant === "HC"
                          ? "Hidrokarbon terdiri dari unsur karbon (C) dan hidrogen (H) yang dapat kita temui pada minyak tanah, bensin, plastik, gas alam, dan lain-lain"
                          : selectedPollutant.pollutant === "NO2"
                          ? "Gas murni yang biasanya berwarna coklat kemerahan. Saat tertiup angin maka gas nitrogen dioksida akan terlihat putih dan berbau menyengat."
                          : selectedPollutant.pollutant === "O3"
                          ? "Ozon (O₃) adalah gas yang dibentuk oleh radiasi ultraviolet (sinar matahari) dan molekul oksigen. Ozon adalah senyawa alam yang berperan penting dalam menghalangi sinar UV yang berbahaya dari matahari - namun, pada dasarnya ozon adalah racun."
                          : selectedPollutant.pollutant === "SO2"
                          ? "Sulfur dioksida (SO₂) adalah gas tidak berwarna. Gas ini termasuk dalam sekelompok gas yang sangat reaktif yang dikenal sebagai 'oksida belerang'. Mereka dengan mudah bereaksi bersama untuk membentuk senyawa berbahaya seperti asam sulfat, asam belerang, dan partikel sulfat."
                          : selectedPollutant.pollutant === "PM10"
                          ? "PM10 adalah partikel di udara dengan diameter 10 mikrometer atau kurang (termasuk asap, jelaga, garam, asam, dan logam). Perbedaan antara PM10 dan PM2.5 hanya pada ukurannya - dimana PM2.5 sangat halus, sedangkan PM10 lebih besar dan kasar."
                          : selectedPollutant.pollutant === "PM2.5"
                          ? "PM2.5 merupakan partikel yang mengambang di udara dengan ukuran diameter 2,5 mikrometer atau kurang. Ukuran PM2.5 sangat kecil sehingga dapat diserap ke dalam aliran darah saat bernapas. Karena alasan ini, biasanya polutan ini menimbulkan ancaman kesehatan terbesar."
                          : "Deskripsi polutan lainnya..."}
                      </p>

                      <p className="mb-1">
                        <strong>
                          Dari mana {selectedPollutant.pollutant} berasal?{" "}
                        </strong>
                      </p>
                      <p className="mb-1">
                        {" "}
                        {selectedPollutant.pollutant === "CO" ? (
                          <>
                            Karbon monoksida (CO) dapat dihasilkan dari berbagai
                            sumber, di antaranya:
                            <ul>
                              <li>
                                Pembakaran bahan bakar fosil, seperti bensin,
                                kayu, arang, dan propana
                              </li>
                              <li>
                                Kendaraan bermotor, seperti mobil dan truk
                              </li>
                              <li>
                                Sistem pemanas, seperti tungku, oven, dan
                                pemanas air
                              </li>
                              <li>
                                Peralatan rumah tangga, seperti kompor gas dan
                                perapian
                              </li>
                              <li>
                                Industri yang menggunakan bahan bakar fosil
                              </li>
                              <li>Asap rokok</li>
                              <li>Penggunaan pipa shisha atau hookah</li>
                            </ul>
                          </>
                        ) : selectedPollutant.pollutant === "HC" ? (
                          "Polutan ini dapat dihasilkan melalui pembakaran bahan bakar atau tumpahan minyak mentah dan termasuk polutan utama yang dihasilkan oleh kendaraan bermotor. Pembakaran hidrokarbon yang tidak sempurna dapat meningkatkan emisi hidrokarbon aromatik polisiklik (PAH) yang berbahaya bagi kesehatan manusia dan lingkungan (H. Zhang dkk., 2022)"
                        ) : selectedPollutant.pollutant === "NO2" ? (
                          "Polutan berbahaya seperti nitrogen dioksida banyak dihasilkan dari aktivitas kendaraan bermotor. Konsentrasi nitrogen dioksida yang dihasilkan oleh aktivitas kendaraan bermotor pada kemacetan lalu lintas dapat berubah-ubah seiring berubahnya volume kendaraan (Fahmi, 2023)."
                        ) : selectedPollutant.pollutant === "O3" ? (
                          "Di kota-kota besar seperti Bogor, konsentrasi polutan udara telah meningkat disebabkan oleh peningkatan urbanisasi dan industrialisasi. Hal tersebut menghasilkan oksida nitrogen dan senyawa organik yang mudah menguap atau hidrokarbon lalu bereaksi dengan panas dan sinar matahari sehingga membentuk ozon (O3) (Berezina dkk., 2020)."
                        ) : selectedPollutant.pollutant === "SO2" ? (
                          "Gas ini berasal dari pembakaran bahan bakar fosil yang mengandung unsur belerang seperti batu bara, kokas, minyak maupun gas (Yunita & Kiswandono, 2017)."
                        ) : selectedPollutant.pollutant === "PM10" ? (
                          "Sumber buatan manusia terdiri dari industri, pembangkit listrik, pertambangan, konstruksi, dan kendaraan bermotor. Menurut Fan & Lin bahwa partikel kasar sebagian besar berasal dari proses mekanis, seperti bioaerosol, proses mekanis di industri dan agrikultur atau debu di permukaan jalan yang tersuspensi ke udara (Fan & Lin, 2011). "
                        ) : selectedPollutant.pollutant === "PM2.5" ? (
                          "Polutan ini umumnya berasal dari pembentukan sekunder dari proses kimiawi atmosfer dan emisi langsung dari proses pembakaran sehingga mengandung lebih banyak spesies organik daripada PM10 (Fan & Lin, 2011)."
                        ) : (
                          "Tidak ada polutan yang terdefinisi"
                        )}
                      </p>

                      <p className="mb-1">
                        <strong>
                          Bagaimana {selectedPollutant.pollutant} mempengaruhi
                          kesehatan kita?{" "}
                        </strong>
                      </p>
                      <p>
                        {" "}
                        {selectedPollutant.pollutant === "CO" ? (
                          <>
                            <strong>Efek jangka pendek:</strong>
                            <ul>
                              <li>Sakit kepala, pusing, dan mual</li>
                              <li>Kesulitan bernafas dan kelelahan</li>
                              <li>
                                Kebingungan dan gangguan kognitif dan detak
                                jantung cepat
                              </li>
                              <li>Gejala mirip flu </li>
                            </ul>
                            <strong>Efek jangka panjang:</strong>
                            <ul>
                              <li>Kerusakan pada jantung dan otak</li>
                              <li>Gangguan pernapasan kronis</li>
                              <li>Peningkatan risiko kanker </li>
                              <li>Efek pada sistem saraf </li>
                            </ul>
                          </>
                        ) : selectedPollutant.pollutant === "HC" ? (
                          <>
                            <strong>Efek jangka pendek:</strong>
                            <ul>
                              <li>Iritasi pada saluran pernapasan</li>
                              <li>Sakit kepala, pusing, dan mual</li>
                              <li>Sering kelelahan</li>
                            </ul>
                            <strong>Efek jangka panjang:</strong>
                            <ul>
                              <li>Kerusakan pada paru-paru</li>
                              <li>Peningkatan risiko kanker </li>
                              <li>Efek pada sistem saraf </li>
                            </ul>
                          </>
                        ) : selectedPollutant.pollutant === "NO2" ? (
                          <>
                            <strong>Efek jangka pendek:</strong>
                            <ul>
                              <li>Iritasi pada saluran pernapasan</li>
                              <li>Gejala flu</li>
                              <li>Gangguan fungsi paru-paru</li>
                            </ul>
                            <strong>Efek jangka panjang:</strong>
                            <ul>
                              <li>Penyakit paru-paru kronis</li>
                              <li>Perburukan asma</li>
                              <li>Penurunan fungsi paru</li>
                              <li>Peningkatan risiko kanker paru</li>
                            </ul>
                          </>
                        ) : selectedPollutant.pollutant === "O3" ? (
                          <>
                            <strong>Efek jangka pendek:</strong>
                            <ul>
                              <li>Iritasi pada saluran pernapasan</li>
                              <li>Penurunan kapasitas paru-paru</li>
                              <li>Kelelahan dan sesak napas</li>
                              <li>Iritasi mata</li>
                            </ul>
                            <strong>Efek jangka panjang:</strong>
                            <ul>
                              <li>Penyakit paru-paru kronis</li>
                              <li>Asma</li>
                              <li>Penurunan fungsi paru</li>
                              <li>Peningkatan risiko kanker paru</li>
                            </ul>
                          </>
                        ) : selectedPollutant.pollutant === "SO2" ? (
                          <>
                            <strong>Efek jangka pendek:</strong>
                            <ul>
                              <li>Iritasi pada saluran pernapasan</li>
                              <li>Meningkatkan gejala asma</li>
                              <li>Kelelahan dan sesak napas</li>
                              <li>Iritasi mata</li>
                            </ul>
                            <strong>Efek jangka panjang:</strong>
                            <ul>
                              <li>Penyakit paru-paru kronis</li>
                              <li>
                                Peningkatan risiko infeksi saluran pernapasan
                              </li>
                              <li>Penurunan fungsi paru</li>
                              <li>Penyebab penyakit kardiovaskular</li>
                            </ul>
                          </>
                        ) : selectedPollutant.pollutant === "PM10" ? (
                          <>
                            <strong>Efek jangka pendek:</strong>
                            <ul>
                              <li>Iritasi pada saluran pernapasan</li>
                              <li>Meningkatkan gejala asma</li>
                              <li>Kelelahan dan sesak napas</li>
                              <li>Iritasi mata</li>
                            </ul>
                            <strong>Efek jangka panjang:</strong>
                            <ul>
                              <li>Penyakit paru-paru kronis</li>
                              <li>
                                Peningkatan risiko infeksi saluran pernapasan
                              </li>
                              <li>Penurunan fungsi paru</li>
                              <li>Penyebab penyakit kardiovaskular</li>
                            </ul>
                          </>
                        ) : selectedPollutant.pollutant === "PM2.5" ? (
                          <>
                            <strong>Efek jangka pendek:</strong>
                            <ul>
                              <li>Iritasi pada saluran pernapasan</li>
                              <li>Meningkatkan gejala alergi</li>
                              <li>Kelelahan dan sesak napas</li>
                              <li>Peningkatan risiko serangan asma</li>
                            </ul>
                            <strong>Efek jangka panjang:</strong>
                            <ul>
                              <li>Penyakit paru-paru kronis</li>
                              <li>Penyakit jantung</li>
                              <li>Kanker paru-paru</li>
                              <li>Gangguan perkembangan pada anak</li>
                              <li>Peningkatan risiko stroke</li>
                              <li>Efek pada sistem saraf</li>
                            </ul>
                          </>
                        ) : (
                          "Tidak ada polutan yang terdefinisi"
                        )}
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        data-bs-dismiss="modal"
                        onClick={handleCloseModal}>
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="my-2 col-md-6 col-lg-6">
          <div className="row">
            <div className="card">
              <h6 className="card-title text-start my-3">
                Prediksi setiap hari
              </h6>
              {Object.keys(forecast).length === 0 ? (
                <p
                  className="text-muted text-center animate-fade"
                  style={{ fontSize: "10px" }}>
                  Sedang mengolah model...
                </p>
              ) : (
                <div
                  className="card-container overflow-auto d-flex rounded"
                  style={{ whiteSpace: "nowrap" }}>
                  {forecast[Object.keys(forecast)[0]].map((entry, index) => (
                    <div
                      key={index}
                      className="card mx-2 mb-4"
                      style={{
                        minWidth: "200px",
                        border: "0px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        backgroundColor: "#F3F5F7",
                      }}>
                      <div
                        className="card-header text-center pb-0"
                        style={{ border: "0px", backgroundColor: "#F3F5F7" }}>
                        <span
                          className="badge text-dark"
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "10px",
                            boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.2)",
                            fontSize: "14px",
                            padding: "8px 12px",
                          }}>
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <div className="card-body">
                        <table className="table table-sm">
                          <tbody>
                            {Object.keys(forecast).map((pollutant) => {
                              const dayForecast = forecast[pollutant].find(
                                (f) => f.date === entry.date
                              );
                              const ispu = dayForecast
                                ? dayForecast.yhat <= 0
                                  ? 0
                                  : dayForecast.yhat
                                : "-";
                              const color = getColorByISPU(ispu);

                              return (
                                <tr key={pollutant}>
                                  <td
                                    className="border-0"
                                    style={{ backgroundColor: "#F3F5F7" }}>
                                    {pollutant === "CO" && (
                                      <i
                                        style={{ marginRight: "10px" }}>🚗</i>
                                    )}
                                    {pollutant === "O3" && (
                                      <i
                                        style={{ marginRight: "10px" }}>🌞</i> 
                                    )}
                                    {pollutant === "NO2" && (
                                      <i
                                        style={{ marginRight: "10px" }}>🏭</i>
                                    )}
                                    {pollutant === "HC" && (
                                      <i
                                        style={{ marginRight: "10px" }}>🛢️ </i>
                                    )}
                                    {pollutant === "PM10" && (
                                      <i
                                        style={{ marginRight: "10px" }}>💨</i>
                                    )}
                                    {pollutant === "PM2.5" && (
                                      <i
                                        style={{ marginRight: "10px" }}>⚙️</i>
                                    )}
                                    {pollutant === "SO2" && (
                                      <i
                                        style={{ marginRight: "10px" }}>🌫️</i>
                                    )}
                                    {pollutant}
                                  </td>

                                  <td
                                    className="border-0"
                                    style={{ backgroundColor: "#F3F5F7" }}>
                                    <p
                                      className="badge"
                                      style={{
                                        margin: 0,
                                        backgroundColor: color,
                                      }}>
                                      {ispu ?? "-"}
                                    </p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </section>

      {showModal && (
        <div
          className="overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1040, // Agar berada di bawah modal
            display: showModal ? "block" : "none",
          }}
          onClick={() => setShowModal(false)}></div>
      )}

      <div
        className={`modal fade ${showModal ? "show" : ""}`}
        tabIndex="-1"
        style={{ display: showModal ? "block" : "none", zIndex: 1050 }}
        onClick={() => setShowModal(false)}>
        <div className="modal-dialog" onClick={handleModalClick}>
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">Prediksi ISPU Berdasarkan Tanggal</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <section>
                <label
                  htmlFor="datePicker"
                  className="form-label"
                  style={{ fontSize: "14px" }}>
                  Pilih Tanggal:
                </label>
                <div className="d-flex justify-content-between">
                  <div className="w-100">
                    <input
                      type="date"
                      id="datePicker"
                      className="form-control"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="ms-2">
                    <button
                      onClick={getPrediction}
                      className="btn btn-sm mt-1"
                      style={{ backgroundColor: "#7E99A3", color: "white" }}
                      disabled={loading}>
                      {loading ? "Memproses model..." : "Prediksi"}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {Array.isArray(specificDatePrediction) ? (
                    <div className="row overflow-x-auto">
                      <h6>Hasil Prediksi:</h6>
                      {specificDatePrediction
                        .slice(0, 6)
                        .map(({ pollutant, prediction }) => {
                          // Pastikan nilai prediksi menjadi integer dan kurang dari sama dengan 0 diatur ke 0
                          const adjustedPrediction = prediction
                            ? Math.max(parseInt(prediction, 10), 0) // Konversi ke integer, nilai minimum adalah 0
                            : 0;

                          const color = getColorByISPU(adjustedPrediction);
                          const level = getLevelByISPU(adjustedPrediction);

                          return (
                            <div key={pollutant} className="col-md-6 mb-3">
                              <div
                                className="card"
                                style={{
                                  border: "0px",
                                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                                }}>
                                <div
                                  className="card-body text-start pb-0"
                                  style={{ backgroundColor: "#F3F5F7" }}>
                                  <h6 className="card-title mb-0">
                                    {pollutant}
                                  </h6>
                                  {pollutant === "CO" ? (
                                    <p style={{ fontSize: "10px" }}>
                                      Karbon Monoksida
                                    </p>
                                  ) : pollutant === "HC" ? (
                                    <p style={{ fontSize: "10px" }}>
                                      Hidrokarbon
                                    </p>
                                  ) : pollutant === "NO2" ? (
                                    <p style={{ fontSize: "10px" }}>
                                      Nitrogen Dioksida
                                    </p>
                                  ) : pollutant === "O3" ? (
                                    <p style={{ fontSize: "10px" }}>Ozon</p>
                                  ) : pollutant === "PM10" ? (
                                    <p style={{ fontSize: "10px" }}>
                                      Materi Partikulat di bawah 10 mikron
                                    </p>
                                  ) : pollutant === "PM2.5" ? (
                                    <p style={{ fontSize: "10px" }}>
                                      Partikel halus di bawah 2,5 mikron
                                    </p>
                                  ) : pollutant === "SO2" ? (
                                    <p style={{ fontSize: "10px" }}>
                                      Sulfur Dioksida
                                    </p>
                                  ) : (
                                    <p
                                      className="text-muted"
                                      style={{ fontSize: "10px" }}>
                                      Polutan tidak terdefinisi
                                    </p>
                                  )}
                                  <p
                                    className="badge"
                                    style={{ backgroundColor: color }}>
                                    {adjustedPrediction.toLocaleString()}
                                  </p>
                                  <span
                                    className="ms-2"
                                    style={{ fontSize: "10px" }}>
                                    µg/m³
                                  </span>

                                  <p
                                    className="badge text-start"
                                    style={{
                                      fontSize: "10px",
                                      backgroundColor: "#FFFFFF",
                                      color: "#7E99A3",
                                      fontWeight: "500",
                                      width: "100%",
                                      left: "0px",
                                    }}>
                                    Status :{" "}
                                    <span
                                      className="fw-bold"
                                      style={{ color: color }}>
                                      {level}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p>{specificDatePrediction}</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
