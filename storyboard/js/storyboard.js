// Storyboard editor: everything is editable in the page and saved to localStorage.
(function () {
  const STORAGE_KEY = 'virtual-objects-storyboard-v1';
  const MAX_IMAGE_WIDTH = 960; // keeps localStorage small

  // Example board. Replace the text with your own concept, or press "Reset example" to get back here.
  const EXAMPLE = {
    title: 'Rebuilt – a scanned object comes to life',
    author: 'Your name',
    date: 'Milestone 2 · 20 Oct',
    description:
      'My animation takes an everyday object I have 3D scanned and shows it being rebuilt from nothing. ' +
      'It starts as scattered points of light in a dark, empty space, which pull together into a wireframe, ' +
      'then a grey clay model, and finally the fully textured scan. The camera begins very close so the ' +
      'viewer cannot tell what the object is, then slowly pulls back as it forms. My aim is to make something ' +
      'ordinary feel strange and precious by showing the digital process behind it: the point cloud, the mesh ' +
      'and the lighting. I want to practise Maya animation, camera moves and lighting, and produce a short ' +
      '(about 20 second) loop that works as a projected piece in the Bridge.',
    shots: [
      {
        name: 'Darkness',
        description: 'Black screen. Tiny points of light drift slowly, like dust caught in a beam.',
        framing: 'Extreme close-up', camera: 'Static, slight drift', duration: '0–3s', audio: 'Low hum',
        prompt: 'Cinematic still, pure black background, hundreds of tiny glowing white particles floating like dust in a light beam, shallow depth of field, minimal, 16:9'
      },
      {
        name: 'Gathering',
        description: 'The points start to move towards the centre of the frame and cluster into a rough shape.',
        framing: 'Close-up', camera: 'Slow push in', duration: '3–6s', audio: 'Hum rises',
        prompt: 'Glowing white point cloud particles swirling and gathering toward the centre of a dark frame, forming a vague 3D shape, motion trails, cinematic, 16:9'
      },
      {
        name: 'Wireframe',
        description: 'Lines connect the points and a wireframe mesh of the object appears, still unrecognisable this close.',
        framing: 'Macro detail', camera: 'Slow orbit right', duration: '6–9s', audio: 'Soft clicks as lines connect',
        prompt: 'Macro shot of a glowing white 3D wireframe mesh of a scanned everyday object on black background, polygon edges, technical, blue-white glow, 16:9'
      },
      {
        name: 'Clay',
        description: 'Faces fill in and the mesh becomes a smooth grey clay model. Soft studio light sweeps across it.',
        framing: 'Close-up', camera: 'Pull back', duration: '9–12s', audio: 'Hum softens',
        prompt: 'Matte grey clay 3D render of a scanned everyday object, soft studio key light sweeping across the surface, dark grey background, Maya viewport style, 16:9'
      },
      {
        name: 'Texture',
        description: 'The scanned colour texture washes over the model from top to bottom. Now we can see what it is.',
        framing: 'Medium shot', camera: 'Continue pull back', duration: '12–15s', audio: 'Bright chime',
        prompt: 'Photorealistic textured 3D scan of an everyday object, colour texture revealing from top to bottom over a grey clay model, dark studio, rim light, 16:9'
      },
      {
        name: 'Hero turn',
        description: 'The finished object slowly turns on an invisible turntable, lit like a product shot.',
        framing: 'Wide / hero', camera: 'Static, object rotates', duration: '15–18s', audio: 'Music peaks',
        prompt: 'Hero product shot of a realistic 3D scanned everyday object rotating on an invisible turntable, dark background, dramatic rim and key lighting, reflections on floor, 16:9'
      },
      {
        name: 'Dissolve',
        description: 'The object breaks back into points of light which drift away, returning to the opening frame so it loops.',
        framing: 'Medium shot', camera: 'Slow push in', duration: '18–21s', audio: 'Fades to hum',
        prompt: 'Realistic 3D object disintegrating into thousands of glowing white particles drifting away into a black void, cinematic, 16:9'
      }
    ]
  };

  const shotsEl = document.getElementById('shots');
  const stripEl = document.getElementById('strip');
  const template = document.getElementById('shot-template');
  let state = load();

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* storage unavailable: fall back to example */ }
    return clone(EXAMPLE);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      alert('Could not save in the browser (images may be too large). Use "Save file" to keep a copy.');
    }
  }

  function render() {
    document.querySelectorAll('[data-field]').forEach(el => {
      el.textContent = state[el.dataset.field] || '';
    });

    shotsEl.innerHTML = '';
    stripEl.innerHTML = '';
    state.shots.forEach((shot, i) => {
      shotsEl.appendChild(renderShot(shot, i));

      const li = document.createElement('li');
      li.innerHTML = '<div class="thumb"></div><span></span>';
      if (shot.image) {
        const img = document.createElement('img');
        img.src = shot.image;
        img.alt = '';
        li.querySelector('.thumb').appendChild(img);
      }
      li.querySelector('span').textContent = (i + 1) + '. ' + (shot.name || '');
      stripEl.appendChild(li);
    });
  }

  function renderShot(shot, index) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.shot-num').textContent = 'Scene 1 · Shot ' + (index + 1);

    node.querySelectorAll('[data-key]').forEach(el => {
      el.textContent = shot[el.dataset.key] || '';
      el.addEventListener('input', () => {
        shot[el.dataset.key] = el.textContent;
        save();
        if (el.dataset.key === 'name') {
          stripEl.children[index].querySelector('span').textContent = (index + 1) + '. ' + el.textContent;
        }
      });
    });

    const frame = node.querySelector('.frame');
    const input = frame.querySelector('input');
    if (shot.image) {
      frame.classList.add('has-image');
      frame.querySelector('img').src = shot.image;
    }
    frame.addEventListener('click', () => input.click());
    frame.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input.click(); });
    input.addEventListener('change', () => { if (input.files[0]) setImage(index, input.files[0]); });
    frame.addEventListener('dragover', e => { e.preventDefault(); frame.classList.add('dragover'); });
    frame.addEventListener('dragleave', () => frame.classList.remove('dragover'));
    frame.addEventListener('drop', e => {
      e.preventDefault();
      frame.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) setImage(index, file);
    });

    node.querySelector('.copy-prompt').addEventListener('click', e => {
      navigator.clipboard.writeText(shot.prompt || '').then(() => {
        e.target.textContent = 'Copied!';
        setTimeout(() => { e.target.textContent = 'Copy prompt'; }, 1200);
      });
    });

    node.querySelector('.shot-controls').addEventListener('click', e => {
      const action = e.target.dataset.action;
      if (!action) return;
      if (action === 'delete' && confirm('Delete shot ' + (index + 1) + '?')) {
        state.shots.splice(index, 1);
      } else if (action === 'left' && index > 0) {
        swap(index, index - 1);
      } else if (action === 'right' && index < state.shots.length - 1) {
        swap(index, index + 1);
      } else if (action === 'clear-image') {
        delete shot.image;
      } else {
        return;
      }
      save();
      render();
    });

    return node;
  }

  function swap(a, b) {
    [state.shots[a], state.shots[b]] = [state.shots[b], state.shots[a]];
  }

  // Downscale uploaded images so the whole board fits in localStorage.
  function setImage(index, file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        state.shots[index].image = canvas.toDataURL('image/jpeg', 0.82);
        save();
        render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  document.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', () => {
      state[el.dataset.field] = el.textContent;
      save();
    });
  });

  document.getElementById('add-shot').addEventListener('click', () => {
    state.shots.push({ name: 'New shot', description: '', framing: '', camera: '', duration: '', audio: '', prompt: '' });
    save();
    render();
    shotsEl.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  const togglePrompts = document.getElementById('toggle-prompts');
  togglePrompts.addEventListener('click', () => {
    const hidden = document.body.classList.toggle('hide-prompts');
    togglePrompts.textContent = hidden ? 'Show AI prompts' : 'Hide AI prompts';
  });

  document.getElementById('export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'storyboard.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('import-json').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(text => {
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data.shots)) throw new Error('missing shots');
        state = data;
        save();
        render();
      } catch (err) {
        alert('That file is not a storyboard save.');
      }
      e.target.value = '';
    });
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Replace your board with the example? Your text and images will be lost.')) return;
    state = clone(EXAMPLE);
    save();
    render();
  });

  document.getElementById('print').addEventListener('click', () => window.print());

  render();
})();
