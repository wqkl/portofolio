import * as THREE from 'three';

// ── Three.js Background ──
const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

// Particles
const particleCount = 1500;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

const accentColor = new THREE.Color(0x4f8fff);
const secondaryColor = new THREE.Color(0x7c5cfc);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 80;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

  const color = Math.random() > 0.5 ? accentColor : secondaryColor;
  colors[i * 3] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;

  sizes[i] = Math.random() * 2 + 0.5;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particleMaterial = new THREE.PointsMaterial({
  size: 0.15,
  vertexColors: true,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// Floating geometric shapes
const shapes = [];
const shapeMaterial = new THREE.MeshPhongMaterial({
  color: 0x4f8fff,
  transparent: true,
  opacity: 0.15,
  wireframe: true,
});

const geometries = [
  new THREE.IcosahedronGeometry(2, 1),
  new THREE.OctahedronGeometry(1.5, 0),
  new THREE.TetrahedronGeometry(1.8, 0),
  new THREE.TorusGeometry(1.5, 0.4, 8, 16),
  new THREE.DodecahedronGeometry(1.3, 0),
];

for (let i = 0; i < 8; i++) {
  const geo = geometries[i % geometries.length];
  const mat = shapeMaterial.clone();
  mat.color = new THREE.Color().lerpColors(accentColor, secondaryColor, Math.random());
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 20 - 10
  );
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  mesh.userData = {
    rotSpeed: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01 },
    floatSpeed: Math.random() * 0.5 + 0.5,
    floatOffset: Math.random() * Math.PI * 2,
  };
  shapes.push(mesh);
  scene.add(mesh);
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x4f8fff, 0.3);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0x7c5cfc, 1, 100);
pointLight.position.set(10, 10, 20);
scene.add(pointLight);

// Connection lines between nearby particles
const lineGeometry = new THREE.BufferGeometry();
const linePositions = new Float32Array(particleCount * 6);
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x4f8fff,
  transparent: true,
  opacity: 0.05,
  blending: THREE.AdditiveBlending,
});
const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
scene.add(lines);

// Mouse tracking
const mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Scroll tracking
let scrollY = 0;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.001;

  // Rotate particles slowly
  particles.rotation.y = time * 0.03 + mouse.x * 0.1;
  particles.rotation.x = mouse.y * 0.05;

  // Float positions
  const pos = particleGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    pos[i * 3 + 1] += Math.sin(time * 0.3 + i * 0.1) * 0.002;
  }
  particleGeometry.attributes.position.needsUpdate = true;

  // Animate shapes
  shapes.forEach((shape) => {
    shape.rotation.x += shape.userData.rotSpeed.x;
    shape.rotation.y += shape.userData.rotSpeed.y;
    shape.position.y += Math.sin(time * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.005;
  });

  // Camera parallax based on scroll
  camera.position.y = -scrollY * 0.005;
  camera.position.x = mouse.x * 2;
  camera.lookAt(0, -scrollY * 0.005, 0);

  // Update connection lines (every 3 frames to save CPU)
  if (Math.floor(time * 60) % 3 === 0) {
    let lineIndex = 0;
    const thresholdSq = 64; // 8^2, skip sqrt
    const checkCount = 100;
    for (let i = 0; i < checkCount; i++) {
      for (let j = i + 1; j < checkCount; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < thresholdSq && lineIndex < linePositions.length - 6) {
          linePositions[lineIndex++] = pos[i * 3];
          linePositions[lineIndex++] = pos[i * 3 + 1];
          linePositions[lineIndex++] = pos[i * 3 + 2];
          linePositions[lineIndex++] = pos[j * 3];
          linePositions[lineIndex++] = pos[j * 3 + 1];
          linePositions[lineIndex++] = pos[j * 3 + 2];
        }
      }
    }
    for (let i = lineIndex; i < linePositions.length; i++) linePositions[i] = 0;
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  }

  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Typing effect ──
const titles = ['Automation Engineer', 'Web Developer', 'Problem Solver', 'Tech Enthusiast'];
const typedEl = document.getElementById('typed-text');
let titleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const current = titles[titleIndex];
  if (isDeleting) {
    typedEl.textContent = current.substring(0, charIndex--);
    if (charIndex < 0) {
      isDeleting = false;
      titleIndex = (titleIndex + 1) % titles.length;
      setTimeout(typeEffect, 500);
      return;
    }
    setTimeout(typeEffect, 40);
  } else {
    typedEl.textContent = current.substring(0, charIndex++);
    if (charIndex > current.length) {
      isDeleting = true;
      setTimeout(typeEffect, 2000);
      return;
    }
    setTimeout(typeEffect, 80);
  }
}
typeEffect();

// ── Scroll animations ──
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.section-container, .hero-content').forEach((el) => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// ── Counter animation ──
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let count = 0;
      const increment = target / 40;
      const timer = setInterval(() => {
        count += increment;
        if (count >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(count);
        }
      }, 40);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach((el) => counterObserver.observe(el));

// ── Smooth nav highlight ──
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach((section) => {
    const top = section.offsetTop - 100;
    if (scrollY >= top) current = section.getAttribute('id');
  });
  navLinks.forEach((link) => {
    link.style.color = '';
    if (link.getAttribute('href') === `#${current}`) {
      link.style.color = 'var(--accent)';
    }
  });
});
