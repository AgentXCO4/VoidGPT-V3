const state = {
  messages: [],

  apiEndpoint:
    localStorage.getItem("voidgpt_api_endpoint") ||
    "/api/chat",

  model:
    localStorage.getItem("voidgpt_model") ||
    "",

  memory:
    localStorage.getItem("voidgpt_memory") ||
    ""
};

const $ = (selector) => document.querySelector(selector);

const chat = $("#chat");
const welcome = $("#welcome");
const composer = $("#composer");
const messageInput = $("#message");
const sendButton = $("#sendButton");
const modelSelect = $("#model");

function addMessage(role, content) {
  const wrap = document.createElement("div");

  wrap.className = `message ${role}`;

  const avatar = document.createElement("div");

  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "V";

  const bubble = document.createElement("div");

  bubble.className = "bubble";
  bubble.textContent = content;

  wrap.append(avatar, bubble);

  chat.appendChild(wrap);

  return bubble;
}

function scrollBottom() {
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function resetChat() {
  state.messages = [];

  chat.innerHTML = "";

  chat.appendChild(welcome);

  welcome.style.display = "block";
}

async function sendMessage(text) {
  const trimmed = text.trim();

  if (!trimmed) {
    return;
  }

  welcome.style.display = "none";

  messageInput.value = "";

  autoResize();

  state.messages.push({
    role: "user",
    content: trimmed
  });

  addMessage("user", trimmed);

  scrollBottom();

  sendButton.disabled = true;

  const bubble = addMessage("assistant", "");

  bubble.textContent = "Thinking…";

  scrollBottom();

  try {
    const response = await fetch(state.apiEndpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        messages: state.messages,

        model:
          modelSelect.value ||
          state.model,

        memory: state.memory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        `Request failed (${response.status})`
      );
    }

    const reply =
      data.output ||
      data.message ||
      "";

    bubble.textContent =
      reply ||
      "No response returned.";

    state.messages.push({
      role: "assistant",
      content: reply
    });
  } catch (error) {
    bubble.textContent =
      `VoidGPT error: ${error.message}`;
  } finally {
    sendButton.disabled = false;

    scrollBottom();
  }
}

composer.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    sendMessage(messageInput.value);
  }
);

messageInput.addEventListener(
  "input",
  autoResize
);

messageInput.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      composer.requestSubmit();
    }
  }
);

function autoResize() {
  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      180
    ) + "px";
}

$("#newChat").addEventListener(
  "click",
  resetChat
);

$("#settingsButton").addEventListener(
  "click",
  () => {
    const dialog = $("#settingsDialog");

    $("#apiEndpoint").value =
      state.apiEndpoint === "/api/chat"
        ? ""
        : state.apiEndpoint;

    $("#defaultModel").value =
      state.model;

    dialog.showModal();
  }
);

$("#settingsForm").addEventListener(
  "submit",
  (event) => {
    if (
      event.submitter?.id !==
      "saveSettings"
    ) {
      return;
    }

    const endpoint =
      $("#apiEndpoint")
        .value
        .trim();

    const model =
      $("#defaultModel")
        .value
        .trim();

    state.apiEndpoint =
      endpoint || "/api/chat";

    state.model = model;

    localStorage.setItem(
      "voidgpt_api_endpoint",
      state.apiEndpoint
    );

    localStorage.setItem(
      "voidgpt_model",
      state.model
    );
  }
);

$("#memoryButton").addEventListener(
  "click",
  () => {
    $("#memoryText").value =
      state.memory;

    $("#memoryDialog").showModal();
  }
);

$("#saveMemory").addEventListener(
  "click",
  (event) => {
    event.preventDefault();

    state.memory =
      $("#memoryText")
        .value
        .trim();

    localStorage.setItem(
      "voidgpt_memory",
      state.memory
    );

    $("#memoryDialog").close();
  }
);

$("#clearMemory").addEventListener(
  "click",
  (event) => {
    event.preventDefault();

    state.memory = "";

    localStorage.removeItem(
      "voidgpt_memory"
    );

    $("#memoryText").value = "";
  }
);

document
  .querySelectorAll("[data-prompt]")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        sendMessage(
          button.dataset.prompt
        );
      }
    );
  });
