import {
  IonBadge,
  IonButton,
  IonCard,
  IonChip,
  IonContent,
  IonIcon,
  IonNote,
  IonPage,
  IonPopover,
} from "@ionic/react";
import {
  alertCircleOutline,
  closeCircleOutline,
  exitOutline,
  gameControllerOutline,
  homeOutline,
  informationCircleOutline,
  pauseCircleOutline,
  playCircleOutline,
  refresh,
  time,
  trophyOutline,
} from "ionicons/icons";
import "./Home.css";
import { useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import type { Exercise } from "../types/game";
import {
  checkAnswer,
  generateExercises,
  getGameConfig,
  getTotalTime,
} from "../utils/ciphers";

type Difficulty = "basic" | "intermediate" | "advanced";

export interface PlayProps {
  difficulty?: Difficulty;
}

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
};

type MemoramaRuntimeConfig = {
  nivel?: string;
  autor?: string;
  version?: string;
  fecha?: string;
  descripcion?: string;
  nombreApp?: string;
  plataformas?: string[];
};

const Home: React.FC<PlayProps> = ({ difficulty = "basic" }) => {
  const [showStartScreen, setShowStartScreen] = useState<boolean>(true);
  const [appNombreJuego, setAppNombreJuego] = useState<string>("STEAM-G");
  const [difficultyConfig, setDifficultyConfig] =
    useState<Difficulty>(difficulty);
  const [showInformation, setShowInformation] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [appDescripcion, setAppDescripcion] = useState<string>(
    "Juego de encriptación y desencriptación de mensajes",
  );
  const [appFecha, setAppFecha] = useState<string>("2 de Diciembre del 2025");
  const [appVersion, setAppVersion] = useState<string>("1.0");
  const [appPlataformas, setAppPlataformas] = useState<string>("android");
  const [appAutor, setAppAutor] = useState<string>("Valeria C. Z.");
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [pausado, setPausado] = useState<boolean>(false);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(
    null,
  );
  const [isComplete, setisComplete] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // Game state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>("");
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const res = await fetch("/config/encriptacion-config.json");

        if (!res.ok) {
          setConfigLoaded(true);
          return;
        }

        const data: MemoramaRuntimeConfig = await res.json();

        if (data.nivel) {
          setDifficultyConfig(normalizarNivelConfig(data.nivel));
        }

        if (data.autor) setAppAutor(data.autor);
        if (data.version) setAppVersion(data.version);
        if (data.fecha) setAppFecha(formatearFechaLarga(data.fecha));
        if (data.descripcion) setAppDescripcion(data.descripcion);
        if (data.plataformas) setAppPlataformas(data.plataformas.join(", "));
        if (data.nombreApp) setAppNombreJuego(data.nombreApp);
      } catch (err) {
        console.error("No se pudo cargar memorama-config.json", err);
      } finally {
        setConfigLoaded(true);
      }
    };

    cargarConfig();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      setTimeout(() => {
        setShowCountdown(false);
        startGameLogic();
      }, 500);
    }
  }, [countdown, showCountdown]);

  // Game timer
  useEffect(() => {
    if (
      !gameActive ||
      isPaused ||
      showCountdown ||
      showFeedback ||
      tiempoRestante <= 0
    )
      return;

    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    gameActive,
    isPaused,
    showCountdown,
    showFeedback,
    tiempoRestante,
    currentExerciseIndex,
  ]);

  // Reset wheel rotation on exercise change
  useEffect(() => {
    setWheelRotation(0);
    if (gameActive) {
      setTiempoRestante(getTotalTime(difficultyConfig));
    }
  }, [currentExerciseIndex, gameActive, difficultyConfig]);

  const TIMEOUT_MESSAGES = [
    "Sigue intentando 💪",
    "No te rindas ✨",
    "¡Vamos, tú puedes! 🚀",
  ];

  const getTimeoutMessage = () =>
    TIMEOUT_MESSAGES[Math.floor(Math.random() * TIMEOUT_MESSAGES.length)];

  const handleTimeExpired = () => {
    if (!gameActive || showFeedback) return;

    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) return;

    const updatedExercises = [...exercises];
    updatedExercises[currentExerciseIndex] = {
      ...currentExercise,
      answered: true,
      correct: false,
    };
    setExercises(updatedExercises);

    setTotalAnswered((prev) => prev + 1);
    setFeedbackMessage(getTimeoutMessage());
    setShowFeedback(true);

    setTimeout(() => {
      advanceAfterFeedback();
    }, 1800);
  };

  // ─── Wheel drag handlers ───

  const getAngleFromCenter = (clientX: number, clientY: number): number => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const handleWheelTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastAngle.current = getAngleFromCenter(touch.clientX, touch.clientY);
    isDragging.current = true;
  };

  const handleWheelTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const angle = getAngleFromCenter(touch.clientX, touch.clientY);
    let delta = angle - lastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    setWheelRotation((prev) => prev + delta);
    lastAngle.current = angle;
  };

  const handleWheelTouchEnd = () => {
    isDragging.current = false;
  };

  const handleWheelMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    lastAngle.current = getAngleFromCenter(e.clientX, e.clientY);
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const angle = getAngleFromCenter(ev.clientX, ev.clientY);
      let delta = angle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      setWheelRotation((prev) => prev + delta);
      lastAngle.current = angle;
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const getDifficultyLabel = (nivel: Difficulty): string => {
    const labels: Record<Difficulty, string> = {
      basic: "Básico",
      intermediate: "Intermedio",
      advanced: "Avanzado",
    };
    return labels[nivel] ?? nivel;
  };

  const getCipherLabel = (type: string): string => {
    const labels: Record<string, string> = {
      caesar: "Cifrado César",
      atbash: "Cifrado Atbash",
      vigenere: "Cifrado Vigenère",
    };
    return labels[type] ?? type;
  };

  const generarConfeti = (cantidad = 60): ConfettiPiece[] => {
    const colores = ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#5f27cd"];

    return Array.from({ length: cantidad }, (_, id) => ({
      id,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2.5,
      color: colores[Math.floor(Math.random() * colores.length)],
    }));
  };

  const formatPlataforma = (texto: string): string => {
    const mapa: Record<string, string> = {
      android: "Android",
      ios: "iOS",
      web: "Web",
    };
    return texto
      .split(/,\s*/)
      .map(
        (p) => mapa[p.toLowerCase()] ?? p.charAt(0).toUpperCase() + p.slice(1),
      )
      .join(", ");
  };

  const normalizarNivelConfig = (nivel: string): Difficulty => {
    const limpio = nivel.toLowerCase();
    const mapa: Record<string, Difficulty> = {
      basico: "basic",
      basic: "basic",
      intermedio: "intermediate",
      intermediate: "intermediate",
      avanzado: "advanced",
      advanced: "advanced",
    };
    return mapa[limpio] ?? "basic";
  };

  const formatearFechaLarga = (isoDate?: string) => {
    if (!isoDate) return appFecha;
    const [year, month, day] = isoDate.split("-");
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const mesIndex = Number(month) - 1;
    if (mesIndex < 0 || mesIndex > 11) return isoDate;

    return `${Number(day)} de ${meses[mesIndex]} del ${year}`;
  };

  const getInstructions = (): string => {
    switch (difficultyConfig) {
      case "basic":
        return "Descifra el mensaje usando el Cifrado César. Cada letra ha sido desplazada un número fijo de posiciones en el alfabeto. Usa la pista del desplazamiento para encontrar la palabra original.";
      case "intermediate":
        return "Descifra el mensaje usando el Cifrado Atbash. El alfabeto está invertido: A=Z, B=Y, C=X... Invierte cada letra para descubrir la palabra.";
      case "advanced":
        return "Descifra el mensaje usando el Cifrado Vigenère. Cada letra se desplaza según la letra correspondiente de la palabra clave. Usa la palabra clave para descifrar.";
    }
  };

  // ─── Game logic ───

  const startGameLogic = () => {
    const config = getGameConfig(difficultyConfig);
    const newExercises = generateExercises(
      difficultyConfig,
      config.totalExercises,
    );
    setExercises(newExercises);
    setCurrentExerciseIndex(0);
    setUserInput("");
    setTotalCorrect(0);
    setTotalAnswered(0);
    setScore(0);
    setMaxScore(config.totalExercises * config.pointsCorrect);
    setTiempoRestante(getTotalTime(difficultyConfig));
    setGameActive(true);
    setShowHint(false);
  };

  const endGame = () => {
    setGameActive(false);
    setShowSummary(true);
  };

  const advanceAfterFeedback = () => {
    setShowFeedback(false);
    setUserInput("");
    setShowHint(false);

    setCurrentExerciseIndex((prev) => {
      const next = prev + 1;
      if (next >= exercises.length) {
        endGame();
        return prev;
      }
      return next;
    });
  };

  const handleSubmitAnswer = () => {
    if (!userInput.trim() || !gameActive || showFeedback) return;

    const currentExercise = exercises[currentExerciseIndex];
    const isCorrect = checkAnswer(userInput, currentExercise.plainText);
    const config = getGameConfig(difficultyConfig);

    const updatedExercises = [...exercises];
    updatedExercises[currentExerciseIndex] = {
      ...currentExercise,
      answered: true,
      correct: isCorrect,
    };
    setExercises(updatedExercises);

    if (isCorrect) {
      setScore((prev) => prev + config.pointsCorrect);
      setTotalCorrect((prev) => prev + 1);
      setFeedbackMessage("¡Correcto!");
    } else {
      setFeedbackMessage(
        `Incorrecto. La respuesta era: ${currentExercise.plainText.toUpperCase()}`,
      );
    }

    setTotalAnswered((prev) => prev + 1);
    setShowFeedback(true);

    setTimeout(() => {
      advanceAfterFeedback();
    }, 1800);
  };

  const handleSkipExercise = () => {
    if (!gameActive || showFeedback) return;

    const currentExercise = exercises[currentExerciseIndex];
    const updatedExercises = [...exercises];
    updatedExercises[currentExerciseIndex] = {
      ...currentExercise,
      answered: true,
      correct: false,
    };
    setExercises(updatedExercises);

    setTotalAnswered((prev) => prev + 1);
    setFeedbackMessage(
      `Saltado. La respuesta era: ${currentExercise.plainText.toUpperCase()}`,
    );
    setShowFeedback(true);

    setTimeout(() => {
      advanceAfterFeedback();
    }, 1800);
  };

  // ─── Navigation handlers ───

  const handleSalirDesdePausa = () => {
    setPausado(false);
    setIsPaused(false);
    handleExitToStart();
  };

  const handleExitApp = async () => {
    try {
      await App.exitApp();
    } catch (e) {
      window.close();
    }
  };

  const handleStartGame = () => {
    setShowStartScreen(false);
    resetGame();
  };

  const handleInformation = () => {
    setShowInformation(!showInformation);
  };

  const handlePausar = () => {
    if (
      showStartScreen ||
      showCountdown ||
      showSummary ||
      showInstructions ||
      showFeedback ||
      pausado
    )
      return;

    setPausado(true);
    setIsPaused(true);
  };

  const handleResume = () => {
    setShowExitModal(false);
    setIsPaused(false);
    setPausado(false);
  };

  const handleExitToStart = () => {
    setShowExitModal(false);
    setIsPaused(false);
    setGameActive(false);

    setShowCountdown(false);
    setShowInstructions(false);
    setShowSummary(false);
    setShowFeedback(false);

    setShowStartScreen(true);
  };

  const resetGame = () => {
    setCountdown(5);
    setShowCountdown(true);
    setActiveButtonIndex(null);
    setisComplete(true);
    setScore(0);
    setMaxScore(0);
    setTiempoRestante(0);
    setExercises([]);
    setCurrentExerciseIndex(0);
    setUserInput("");
    setTotalCorrect(0);
    setTotalAnswered(0);
    setGameActive(false);
    setShowHint(false);
    setShowSummary(false);
    setShowFeedback(false);
    setWheelRotation(0);
  };

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.max(0, segundos % 60);
    return `${minutos}:${segs.toString().padStart(2, "0")}`;
  };

  const currentExercise =
    exercises.length > 0 ? exercises[currentExerciseIndex] : null;

  // ─── Cipher wheel ───

  const ALPHABET_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const OUTER_R = 123;
  const INNER_R = 92;

  return (
    <IonPage>
      {showCountdown && countdown > 0 && (
        <div className="countdown-overlay">
          <div className="countdown-number">{countdown}</div>
        </div>
      )}

      {showFeedback && (
        <div className="feedback-overlay">
          <div className="feedback-text">{feedbackMessage}</div>
        </div>
      )}

      {showSummary && (
        <div className="summary-overlay">
          <div className="summary-message">
            {(() => {
              const total = totalAnswered;
              const correctas = totalCorrect;
              const incorrectas = Math.max(total - correctas, 0);
              const porcentaje =
                total > 0 ? Math.round((correctas / total) * 100) : 0;
              const etiqueta =
                correctas === total
                  ? "PERFECTO!"
                  : porcentaje >= 70
                    ? "Excelente!"
                    : porcentaje >= 50
                      ? "Buen trabajo!"
                      : "Sigue practicando!";

              return (
                <>
                  <h2>Juego Terminado</h2>

                  <div className="resumen-final">
                    <h3>Resultados Finales</h3>

                    <p>
                      <strong>Correctos:</strong> {correctas}
                    </p>
                    <p>
                      <strong>Incorrectos:</strong> {incorrectas}
                    </p>
                    <p>
                      <strong>Puntuación total:</strong> {score} / {maxScore}
                    </p>

                    <IonBadge className="badge">{etiqueta}</IonBadge>
                  </div>

                  <IonButton
                    id="finalize"
                    expand="block"
                    onClick={handleSalirDesdePausa}
                  >
                    <IonIcon icon={refresh} slot="start" />
                    Jugar de Nuevo
                  </IonButton>

                  <IonButton
                    id="exit"
                    expand="block"
                    onClick={handleExitApp}
                    style={{ marginTop: "15px" }}
                  >
                    <IonIcon slot="start" icon={exitOutline}></IonIcon>
                    Cerrar aplicación
                  </IonButton>
                </>
              );
            })()}
          </div>

          <div className="confetti-container">
            {generarConfeti().map((c) => (
              <div
                key={c.id}
                className="confetti"
                style={{
                  left: `${c.left}%`,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.duration}s`,
                  backgroundColor: c.color,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="ins-overlay" onClick={() => setShowInstructions(false)}>
          <div className="ins-card" onClick={(e) => e.stopPropagation()}>
            <div className="ins-title">
              <h2
                style={{ margin: 0, fontWeight: "bold", color: "var(--dark)" }}
              >
                Reglas Básicas
              </h2>
              <IonIcon
                icon={closeCircleOutline}
                style={{ fontSize: "26px", color: "var(--dark)" }}
                onClick={() => setShowInstructions(false)}
              />
            </div>

            <div className="ins-stats">
              <p style={{ textAlign: "justify" }}>
                <strong>{getInstructions()}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {showInformation && (
        <div className="info-modal-background">
          <div className="info-modal">
            <div className="header">
              <h2 style={{ color: "var(--color-primary)", fontWeight: "bold" }}>
                {appNombreJuego}
              </h2>
              <p
                style={{
                  color: "#8b8b8bff",
                  marginTop: "5px",
                  textAlign: "center",
                }}
              >
                Actividad configurada desde la plataforma Steam-G
              </p>
            </div>
            <div className="cards-info">
              <div className="card">
                <p className="title">VERSIÓN</p>
                <p className="data">{appVersion}</p>
              </div>
              <div className="card">
                <p className="title">FECHA DE CREACIÓN</p>
                <p className="data">{appFecha}</p>
              </div>
              <div className="card">
                <p className="title">PLATAFORMAS</p>
                <p className="data">{formatPlataforma(appPlataformas)}</p>
              </div>
              <div className="card">
                <p className="title">NÚMERO DE EJERCICIOS</p>
                <p className="data">
                  {getGameConfig(difficultyConfig).totalExercises}
                </p>
              </div>
              <div className="card description">
                <p className="title">DESCRIPCIÓN</p>
                <p className="data">{appDescripcion}</p>
              </div>
            </div>
            <div className="button">
              <IonButton expand="full" onClick={handleInformation}>
                Cerrar
              </IonButton>
            </div>
          </div>
        </div>
      )}

      {pausado && (
        <div className="pause-overlay">
          <div className="pause-card">
            <h2>Juego en pausa</h2>
            <p>El tiempo está detenido.</p>

            <IonButton
              expand="block"
              id="resume"
              style={{ marginTop: "16px" }}
              onClick={handleResume}
            >
              <IonIcon slot="start" icon={playCircleOutline}></IonIcon>
              Reanudar
            </IonButton>

            <IonButton
              expand="block"
              id="finalize"
              style={{ marginTop: "10px" }}
              onClick={handleSalirDesdePausa}
            >
              <IonIcon slot="start" icon={homeOutline}></IonIcon>
              Finalizar juego
            </IonButton>

            <IonButton
              expand="block"
              id="exit"
              style={{ marginTop: "10px" }}
              onClick={handleExitApp}
            >
              <IonIcon slot="start" icon={exitOutline}></IonIcon>
              Cerrar aplicación
            </IonButton>
          </div>
        </div>
      )}

      <IonContent fullscreen className="ion-padding">
        {showStartScreen ? (
          <div className="inicio-container">
            <div className="header-game ion-no-border">
              <div className="toolbar-game">
                <div className="titles start-page">
                  <h1>{appNombreJuego}</h1>
                </div>
              </div>
            </div>

            <div className="info-juego">
              <div className="info-item">
                <IonChip>
                  <strong>Nivel: {getDifficultyLabel(difficultyConfig)}</strong>
                </IonChip>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              className="page-start-btns"
            >
              <IonButton onClick={handleStartGame} className="play">
                <IonIcon slot="start" icon={playCircleOutline}></IonIcon>
                Iniciar juego
              </IonButton>
              <IonButton onClick={handleInformation} className="info">
                <IonIcon slot="start" icon={informationCircleOutline}></IonIcon>
                Información
              </IonButton>
            </div>
          </div>
        ) : (
          <>
            <div className="header-game ion-no-border">
              <div className="toolbar-game">
                <div className="titles">
                  <h1>STEAM-G</h1>
                  <IonIcon
                    icon={alertCircleOutline}
                    size="small"
                    id="info-icon"
                  />
                  <IonPopover
                    trigger="info-icon"
                    side="bottom"
                    alignment="center"
                  >
                    <IonCard className="filter-card ion-no-margin">
                      <div className="section header-section">
                        <h2>{appNombreJuego}</h2>
                      </div>

                      <div className="section description-section">
                        <p>{appDescripcion}</p>
                      </div>

                      <div className="section footer-section">
                        <span>{appFecha}</span>
                      </div>
                    </IonCard>
                  </IonPopover>
                </div>
                <span>
                  <strong>{appNombreJuego}</strong>
                </span>
              </div>
            </div>

            <div className="instructions-exercises">
              <div className="num-words play">
                <strong>
                  Juego {currentExerciseIndex + 1} de {exercises.length}
                </strong>
              </div>

              <div className="temporizador">
                <IonIcon icon={time} className="icono" />
                <h5 className="tiempo-display">
                  {formatearTiempo(tiempoRestante)}
                </h5>
              </div>

              <div className="num-words score">
                <strong>Puntuación: {score}</strong>
              </div>

              <div className="num-words rules">
                <strong onClick={() => setShowInstructions(true)}>
                  Reglas Básicas
                </strong>
              </div>
            </div>

            <div className="videogame">
              <div className="cipher-label">
                <IonBadge className="cipher-badge">
                  {getCipherLabel(currentExercise?.cipherType || "")}
                </IonBadge>
              </div>

              <div className="category-hint">
                <IonNote>Categoría: {currentExercise?.category || ""}</IonNote>
              </div>

              <div className="cipher-wheel-container">
                <div
                  className="cipher-wheel"
                  ref={wheelRef}
                  onTouchStart={handleWheelTouchStart}
                  onTouchMove={handleWheelTouchMove}
                  onTouchEnd={handleWheelTouchEnd}
                  onMouseDown={handleWheelMouseDown}
                >
                  <div className="wheel-ring outer-ring" />
                  <div className="wheel-ring middle-ring" />
                  <div className="wheel-center">
                    <span className="wheel-center-label">
                      {currentExercise?.encryptedText}
                    </span>
                  </div>

                  {ALPHABET_LETTERS.map((letter, i) => {
                    const angleDeg = (i / 26) * 360 - 90;
                    const rad = (angleDeg * Math.PI) / 180;
                    const x = OUTER_R * Math.cos(rad);
                    const y = OUTER_R * Math.sin(rad);
                    return (
                      <span
                        key={`o-${i}`}
                        className="wheel-letter outer"
                        style={{
                          transform: `translate(calc(-50% + ${x}px), calc(-40% + ${y}px))`,
                        }}
                      >
                        {letter}
                      </span>
                    );
                  })}

                  <div
                    className="wheel-inner-rotatable"
                    style={{ transform: `rotate(${wheelRotation}deg)` }}
                  >
                    {ALPHABET_LETTERS.map((letter, i) => {
                      const angleDeg = (i / 26) * 360 - 90;
                      const rad = (angleDeg * Math.PI) / 180;
                      const x = INNER_R * Math.cos(rad);
                      const y = INNER_R * Math.sin(rad);
                      return (
                        <span
                          key={`i-${i}`}
                          className="wheel-letter inner"
                          style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${-wheelRotation}deg)`,
                          }}
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="hint-section">
                <IonButton
                  fill="outline"
                  size="small"
                  disabled={showHint}
                  onClick={() => setShowHint(!showHint)}
                  className="hint-button"
                >
                  Mostrar pista
                </IonButton>
                {showHint && (
                  <div className="hint-text">{currentExercise?.hint}</div>
                )}
              </div>

              <div className="answer-section">
                <input
                  ref={inputRef}
                  type="text"
                  className="answer-input"
                  placeholder="Escribe tu respuesta..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitAnswer();
                  }}
                  disabled={showFeedback || !gameActive}
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>
            </div>

            <div className="button game">
              <IonButton
                shape="round"
                expand="full"
                onClick={handleSubmitAnswer}
                disabled={!userInput.trim() || showFeedback}
                className="submit-btn"
              >
                Verificar
              </IonButton>
              <IonButton
                shape="round"
                expand="full"
                onClick={handlePausar}
                disabled={
                  showCountdown ||
                  showFeedback ||
                  showSummary ||
                  showInstructions ||
                  pausado ||
                  activeButtonIndex !== null ||
                  !isComplete
                }
              >
                <IonIcon slot="start" icon={pauseCircleOutline} />
                Pausar
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
