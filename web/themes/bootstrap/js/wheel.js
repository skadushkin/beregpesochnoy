(function () {
  "use strict";

  const prizes = [
    { id: "green-hedge", title: "Зеленая изгородь", emailText: "Выиграл зеленую изгородь" },
    { id: "gas-boiler", title: "Газовый котел", emailText: "Выиграл газовый котел" },
    { id: "gas-compensation", title: "Компенсация за газоснабжение", emailText: "Выиграл компенсацию за газоснабжение" },
    { id: "auto-gates", title: "Автоматические ворота", emailText: "Выиграл автоматические ворота" },
    { id: "modular-bath", title: "Модульная баня", emailText: "Выиграл модульную баню" },
    { id: "year-no-utilities", title: "Год без коммуналки", emailText: "Выиграл год без коммуналки" },
    { id: "fridge-gift", title: "Холодильник в подарок", emailText: "Выиграл холодильник в подарок" },
    { id: "site-drainage", title: "Дренаж участка", emailText: "Выиграл дренаж участка" },
  ];

  const sectorColors = ["#ad9170", "#765e50"];
  const labelTone = ["dark", "light", "dark", "light", "dark", "light", "dark", "light"];
  const STORAGE_KEY = "bereg_wheel_result_v1";
  const segmentCount = prizes.length;
  const segmentAngle = 360 / segmentCount;

  const root = document.querySelector("[data-wheel-fortune]");
  if (!root) return;

  const wheel = root.querySelector("#wheelFortune");
  const labelLayer = root.querySelector("#wheelFortuneLabels");
  const spinBtn = root.querySelector("#wheelFortuneSpin");
  const statusEl = root.querySelector("#wheelFortuneStatus");
  const nameInput = root.querySelector("#wheelFortuneName");
  const phoneInput = root.querySelector("#wheelFortunePhone");
  const consentInput = root.querySelector("#wheelFortuneConsent");
  const formBox = root.querySelector("#wheelFortuneForm");
  const wonBox = root.querySelector("#wheelFortuneWon");
  const giftText = root.querySelector("#wheelFortuneGift");
  const wheelForm = root.querySelector("#wheelFortuneFormEl");
  const soundToggle = document.querySelector("#wheelFortuneSoundToggle");
  const wheelSound = document.querySelector("#wheelFortuneSound");

  let currentRotation = 0;
  let spinning = false;
  let soundEnabled = true;

  if (wheelSound) {
    wheelSound.volume = 0.35;
  }

  function showConfetti() {
    if (typeof confetti !== "function") return;
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { x: 0.5, y: 0.45 },
      colors: ["#765e50", "#ad9170", "#fffbf3", "#b08770"],
    });
  }

  function getWheelSize() {
    return wheel.offsetWidth || 500;
  }

  function getTextRadius() {
    return getWheelSize() * 0.23;
  }

  function getLabelWidth() {
    const size = getWheelSize();
    return Math.max(100, size * 0.3);
  }

  function wrapLabel(text, maxLen) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? line + " " + word : word;
      if (candidate.length <= maxLen) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3).join("<br>");
  }

  function buildWheel() {
    const sectors = [];
    for (let i = 0; i < segmentCount; i++) {
      const start = i * segmentAngle;
      const end = (i + 1) * segmentAngle;
      sectors.push(sectorColors[i % 2] + " " + start + "deg " + end + "deg");
    }
    wheel.style.background = "conic-gradient(" + sectors.join(", ") + ")";

    labelLayer.innerHTML = "";
    const radius = getTextRadius();
    const labelW = getLabelWidth();
    const lineLimit = labelW > 170 ? 16 : labelW > 130 ? 13 : 10;

    prizes.forEach(function (prize, i) {
      const label = document.createElement("div");
      label.className =
        "wheel-fortune-label wheel-fortune-label--" + labelTone[i % labelTone.length];
      label.style.width = labelW + "px";
      label.innerHTML = wrapLabel(prize.title, lineLimit);
      const angle = i * segmentAngle + segmentAngle / 2 - 90;
      label.style.transform = "rotate(" + angle + "deg) translate(" + radius + "px, -50%)";
      labelLayer.appendChild(label);
    });
  }

  function normalizePhoneDigits(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length >= 11 && (digits[0] === "7" || digits[0] === "8")) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 10);
  }

  function formatPhone(value) {
    const digits = normalizePhoneDigits(value);
    const parts = [];
    if (digits.substring(0, 3)) parts.push(digits.substring(0, 3));
    if (digits.substring(3, 6)) parts.push(digits.substring(3, 6));
    if (digits.substring(6, 8)) parts.push(digits.substring(6, 8));
    if (digits.substring(8, 10)) parts.push(digits.substring(8, 10));
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] + " " + parts[1];
    if (parts.length === 3) return parts[0] + " " + parts[1] + "-" + parts[2];
    return parts[0] + " " + parts[1] + "-" + parts[2] + "-" + parts[3];
  }

  function getStored() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function setStored(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function showStatus(msg, type) {
    statusEl.className = "wheel-fortune-status";
    if (type === "success") statusEl.classList.add("is-success");
    if (type === "error") statusEl.classList.add("is-error");
    statusEl.textContent = msg;
  }

  function validate() {
    const name = nameInput.value.trim();
    const phoneDigits = normalizePhoneDigits(phoneInput.value);

    nameInput.classList.remove("is-error");
    phoneInput.classList.remove("is-error");

    if (name.length < 2) {
      showStatus("Введите имя (минимум 2 символа).", "error");
      nameInput.classList.add("is-error");
      return false;
    }

    if (phoneDigits.length !== 10) {
      showStatus("Введите телефон (10 цифр).", "error");
      phoneInput.classList.add("is-error");
      return false;
    }

    if (consentInput && !consentInput.checked) {
      showStatus("Необходимо согласие с политикой конфиденциальности.", "error");
      return false;
    }

    return true;
  }

  function stopSlowAnimation() {
    wheel.classList.add("is-spinning");
    const transform = window.getComputedStyle(wheel).transform;
    if (transform && transform !== "none") {
      const values = transform.split("(")[1].split(")")[0].split(",");
      const a = values[0];
      const b = values[1];
      currentRotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }
  }

  function startSlowAnimation() {
    wheel.classList.remove("is-spinning");
    wheel.style.transform = "";
    currentRotation = 0;
  }

  function applyWonState(result) {
    wheelForm.style.display = "none";
    var consentLabel = root.querySelector(".wheel-fortune-consent");
    if (consentLabel) consentLabel.style.display = "none";
    wonBox.classList.add("is-visible");
    giftText.textContent = result.prizeTitle;
    setWheelToPrizeIndex(result.prizeIndex);
    showConfetti();
  }

  function applyReadyState() {
    wheelForm.style.display = "block";
    var consentLabel = root.querySelector(".wheel-fortune-consent");
    if (consentLabel) consentLabel.style.display = "flex";
    wonBox.classList.remove("is-visible");
    showStatus("", "info");
    startSlowAnimation();
  }

  function randomPrizeIndex() {
    return Math.floor(Math.random() * segmentCount);
  }

  function calcRotationForPrize(index) {
    const baseSpins = 8;
    const targetAngle = 90 - (index * segmentAngle + segmentAngle / 2);
    return baseSpins * 360 + targetAngle;
  }

  function setWheelTransform(rotation) {
    wheel.style.transform = "rotate(" + rotation + "deg)";
  }

  function setWheelToPrizeIndex(index) {
    stopSlowAnimation();
    const rotation = calcRotationForPrize(index);
    currentRotation = rotation;
    wheel.style.transition = "none";
    setWheelTransform(rotation);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        wheel.style.transition = "transform 6s cubic-bezier(0.25, 0.1, 0.15, 1)";
      });
    });
  }

  function playWheelSound() {
    if (soundEnabled && wheelSound) {
      wheelSound.currentTime = 0;
      wheelSound.play().catch(function () {});
    }
  }

  function stopWheelSound() {
    if (wheelSound) {
      wheelSound.pause();
      wheelSound.currentTime = 0;
    }
  }

  function sendLead(payload) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("phone", payload.phone);
    formData.append("prize", payload.prizeTitle);
    formData.append("prize_index", String(payload.prizeIndex));
    formData.append("prize_id", payload.prizeId);
    formData.append("prize_description", payload.prizeTextForEmail);
    formData.append("source", payload.source);
    formData.append("user_agent", navigator.userAgent);
    formData.append("site", "bereg");

    return fetch("/send.php", { method: "POST", body: formData })
      .then(function (response) {
        return response.text().then(function (raw) {
          let result = {};
          try {
            result = raw ? JSON.parse(raw) : {};
          } catch (e) {
            return {
              success: false,
              message: "Сервер вернул некорректный ответ.",
            };
          }
          if (!response.ok && result.success !== false && !result.message) {
            result.success = false;
            result.message = "HTTP " + response.status;
          }
          return result;
        });
      })
      .catch(function () {
        return {
          success: false,
          message: "Ошибка соединения с сервером. Попробуйте позже.",
        };
      });
  }

  function handleSpin(e) {
    if (e) e.preventDefault();
    if (spinning) return;

    spinning = true;
    spinBtn.disabled = true;

    Promise.resolve()
      .then(function () {
        if (!validate()) return null;

        const stored = getStored();
        if (stored) {
          applyWonState(stored);
          return null;
        }

        const name = nameInput.value.trim();
        const phoneDigits = normalizePhoneDigits(phoneInput.value);
        const phone = "+7" + phoneDigits;

        const lookupFd = new FormData();
        lookupFd.append("phone", phone);
        lookupFd.append("wheel_lookup", "1");
        lookupFd.append("site", "bereg");
        showStatus("Проверяем номер...", "info");

        return fetch("/send.php", { method: "POST", body: lookupFd })
          .then(function (res) {
            return res.text();
          })
          .then(function (raw) {
            let lookupJson = {};
            try {
              lookupJson = raw ? JSON.parse(raw) : {};
            } catch (err) {
              showStatus("Не удалось связаться с сервером. Попробуйте позже.", "error");
              return null;
            }

            if (!lookupJson || lookupJson.success !== true) {
              showStatus(
                lookupJson && lookupJson.message
                  ? lookupJson.message
                  : "Ошибка проверки номера.",
                "error"
              );
              return null;
            }

            if (lookupJson.exists === true) {
              const resultData = {
                name: name,
                phone: phone,
                prizeIndex: lookupJson.prizeIndex,
                prizeId: lookupJson.prizeId,
                prizeTitle: lookupJson.prizeTitle,
                createdAt: new Date().toISOString(),
                emailSent: true,
              };
              setStored(resultData);
              applyWonState(resultData);
              showStatus("Этот номер уже участвовал — показываем ваш подарок.", "success");
              return null;
            }

            stopSlowAnimation();
            playWheelSound();
            showStatus("Колесо крутится... Отправляем заявку...", "info");

            const prizeIndex = randomPrizeIndex();
            const prize = prizes[prizeIndex];
            currentRotation += calcRotationForPrize(prizeIndex);
            wheel.style.transition = "transform 6s cubic-bezier(0.25, 0.1, 0.15, 1)";
            setWheelTransform(currentRotation);

            const payload = {
              name: name,
              phone: phone,
              prizeIndex: prizeIndex,
              prizeId: prize.id,
              prizeTitle: prize.title,
              prizeTextForEmail: prize.emailText,
              source: "page-node-835-wheel-bereg",
            };

            return sendLead(payload).then(function (serverResponse) {
              let finalPrizeIndex = prizeIndex;
              let finalPrizeTitle = prize.title;
              let finalPrizeId = prize.id;
              if (
                serverResponse.already_registered &&
                typeof serverResponse.prizeIndex === "number"
              ) {
                finalPrizeIndex = serverResponse.prizeIndex;
                finalPrizeTitle = serverResponse.prizeTitle || finalPrizeTitle;
                finalPrizeId = serverResponse.prizeId || finalPrizeId;
              }

              const resultData = {
                name: name,
                phone: phone,
                prizeIndex: finalPrizeIndex,
                prizeId: finalPrizeId,
                prizeTitle: finalPrizeTitle,
                createdAt: new Date().toISOString(),
                emailSent: serverResponse.success === true,
              };

              setStored(resultData);

              return new Promise(function (resolve) {
                setTimeout(function () {
                  resolve({ resultData: resultData, serverResponse: serverResponse });
                }, 6000);
              });
            });
          });
      })
      .then(function (done) {
        if (!done) return;
        stopWheelSound();
        applyWonState(done.resultData);
        showConfetti();
        if (done.serverResponse.success === true) {
          showStatus(
            "Подарок: " +
              done.resultData.prizeTitle +
              ". Заявка отправлена! Менеджер скоро свяжется с вами.",
            "success"
          );
        } else {
          showStatus(
            done.resultData.prizeTitle +
              ". " +
              (done.serverResponse.message ||
                "Менеджер свяжется с вами в ближайшее время."),
            "error"
          );
        }
      })
      .finally(function () {
        spinning = false;
        spinBtn.disabled = false;
      });
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      soundEnabled = !soundEnabled;
      soundToggle.textContent = soundEnabled ? "\uD83D\uDD0A" : "\uD83D\uDD07";
      soundToggle.classList.toggle("is-muted", !soundEnabled);
      if (!soundEnabled) stopWheelSound();
    });
  }

  phoneInput.addEventListener("input", function (e) {
    e.target.value = formatPhone(e.target.value);
  });

  wheelForm.addEventListener("submit", handleSpin);

  window.addEventListener("resize", buildWheel);

  buildWheel();
  const stored = getStored();
  if (stored && typeof stored.prizeIndex === "number") {
    stopSlowAnimation();
    applyWonState(stored);
  } else {
    applyReadyState();
  }
})();
