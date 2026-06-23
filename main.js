window.onload = function () {
  var messagesEl = document.querySelector('.messages');
  var typingSpeed = 20;
  var loadingText = '<b>•</b><b>•</b><b>•</b>';
  var messageIndex = 0;

  var getCurrentTime = function () {
    var hours = new Date().getHours();
    if (hours >= 5 && hours < 19) return 'Have a nice day';
    if (hours >= 19 && hours < 22) return 'Have a nice evening';
    return 'Have a good night';
  };

  var hellos = [
    'Hey there', 'Hola', 'Bonjour', 'Ciao', 'Hallo', 'Olá', 'Halo', 'Hej',
    '你好 (Nǐ hǎo)', 'こんにちは (Konnichiwa)', '안녕하세요 (Annyeong)', 'Xin chào',
  ];

  var messages = [
    hellos[anime.random(0, hellos.length - 1)] + ' 👋',
    "I'm Daniel",
    'I design automation systems & code things on the web',
    'From automating programs to modern web apps',
    'You can find me on <a target="_blank" href="https://github.com/wqkl">GitHub</a> and <a target="_blank" href="https://www.linkedin.com/in/danielchristian06/">LinkedIn</a>',
    getCurrentTime(),
    '~ DCN',
  ];

  var getFontSize = function () {
    return parseInt(getComputedStyle(document.body).getPropertyValue('font-size'));
  };

  var pxToRem = function (px) {
    return px / getFontSize() + 'rem';
  };

  var createBubbleElements = function (message, position) {
    var bubbleEl = document.createElement('div');
    var messageEl = document.createElement('span');
    var loadingEl = document.createElement('span');
    bubbleEl.classList.add('bubble', 'is-loading', 'cornered', position === 'right' ? 'right' : 'left');
    messageEl.classList.add('message');
    loadingEl.classList.add('loading');
    messageEl.innerHTML = message;
    loadingEl.innerHTML = loadingText;
    bubbleEl.appendChild(loadingEl);
    bubbleEl.appendChild(messageEl);
    bubbleEl.style.opacity = '0';
    return { bubble: bubbleEl, message: messageEl, loading: loadingEl };
  };

  var getDimentions = function (elements) {
    var messageW = elements.message.offsetWidth + 2;
    var messageH = elements.message.offsetHeight;
    var messageS = getComputedStyle(elements.bubble);
    var paddingTop = Math.ceil(parseFloat(messageS.paddingTop));
    var paddingLeft = Math.ceil(parseFloat(messageS.paddingLeft));
    return {
      loading: { w: '4rem', h: '2.25rem' },
      bubble: { w: pxToRem(messageW + paddingLeft * 2), h: pxToRem(messageH + paddingTop * 2) },
      message: { w: pxToRem(messageW), h: pxToRem(messageH) },
    };
  };

  var sendMessage = function (message, position) {
    var loadingDuration = (message.replace(/<(?:.|\n)*?>/gm, '').length * typingSpeed) + 500;
    var elements = createBubbleElements(message, position);
    messagesEl.appendChild(elements.bubble);
    messagesEl.appendChild(document.createElement('br'));
    var dimensions = getDimentions(elements);
    elements.message.style.display = 'block';
    elements.bubble.style.width = '0rem';
    elements.bubble.style.height = dimensions.loading.h;
    elements.message.style.width = dimensions.message.w;
    elements.message.style.height = dimensions.message.h;
    elements.bubble.style.opacity = '1';
    var bubbleOffset = elements.bubble.offsetTop + elements.bubble.offsetHeight;
    if (bubbleOffset > messagesEl.offsetHeight) {
      anime({ targets: messagesEl, scrollTop: bubbleOffset, duration: 750 });
    }
    var bubbleSize = anime({
      targets: elements.bubble,
      width: ['0ch', dimensions.loading.w],
      marginTop: ['2.5rem', 0],
      marginLeft: ['-2.5rem', 0],
      duration: 800,
      easing: 'easeOutElastic',
    });
    var loadingLoop = anime({
      targets: elements.bubble,
      scale: [1.05, .95],
      duration: 1100,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutQuad',
    });
    anime({
      targets: elements.loading,
      translateX: ['-2rem', '0rem'],
      scale: [.5, 1],
      duration: 400,
      delay: 25,
      easing: 'easeOutElastic',
    });
    var dotsPulse = anime({
      targets: elements.bubble.querySelectorAll('b'),
      scale: [1, 1.25],
      opacity: [.5, 1],
      duration: 300,
      loop: true,
      direction: 'alternate',
      delay: function (i) { return (i * 100) + 50; },
    });
    setTimeout(function () {
      loadingLoop.pause();
      dotsPulse.restart({
        opacity: 0,
        scale: 0,
        loop: false,
        direction: 'forwards',
        update: function (a) {
          if (a.progress >= 65 && elements.bubble.classList.contains('is-loading')) {
            elements.bubble.classList.remove('is-loading');
            anime({ targets: elements.message, opacity: [0, 1], duration: 300 });
          }
        },
      });
      bubbleSize.restart({
        scale: 1,
        width: [dimensions.loading.w, dimensions.bubble.w],
        height: [dimensions.loading.h, dimensions.bubble.h],
        marginTop: 0,
        marginLeft: 0,
        begin: function () {
          if (messageIndex < messages.length) elements.bubble.classList.remove('cornered');
        },
      });
    }, loadingDuration - 50);
  };

  var textLen = function (m) {
    return m.replace(/<(?:.|\n)*?>/gm, '').length;
  };

  var replies = {
    'Projects': [
      '📷 OCV System — optical character verification for automated quality inspection',
      '🐔 Environmental Monitoring — PID-controlled IoT for poultry farms',
      '🌐 This site — a chat-style portfolio in vanilla JS + anime.js',
    ],
    'About me': [
      "I'm an Automation Engineer & Web Developer",
      'I build systems that bridge hardware and the web — PLCs, IoT sensors, dashboards',
      'Off the clock I tinker with electronics and 3D things',
    ],
  };

  // Type out a list of bubbles, then run done().
  var streamMessages = function (list, done) {
    var message = list.shift();
    if (!message) { if (done) setTimeout(done, 400); return; }
    sendMessage(message);
    setTimeout(function () { streamMessages(list, done); },
      (textLen(message) * typingSpeed) + anime.random(900, 1200));
  };

  // Tappable quick-reply chips: tap → answer types out → menu returns.
  var showMenu = function () {
    var menu = document.createElement('div');
    menu.className = 'menu';
    Object.keys(replies).forEach(function (label, i) {
      if (i) menu.appendChild(document.createTextNode(' '));
      var chip = document.createElement('span');
      chip.className = 'bubble right chip';
      chip.textContent = label;
      chip.onclick = function () {
        menu.remove();
        streamMessages(replies[label].slice(), showMenu);
      };
      menu.appendChild(chip);
    });
    messagesEl.appendChild(menu);
    anime({ targets: menu, opacity: [0, 1], translateY: [8, 0], duration: 400 });
  };

  var sendMessages = function () {
    var message = messages[messageIndex];
    if (!message) { showMenu(); return; }
    sendMessage(message);
    ++messageIndex;
    setTimeout(sendMessages, (textLen(message) * typingSpeed) + anime.random(900, 1200));
  };

  sendMessages();
};
