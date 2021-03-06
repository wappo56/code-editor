function selectword() {
  const {
    editor,
    controls,
    container
  } = editorManager;
  const $content = container.querySelector('.ace_scroller');
  const lineHeight = editor.renderer.lineHeight;
  const $cm = controls.menu;
  const $cursor = editor.container.querySelector('.ace_cursor-layer>.ace_cursor');
  const initialScroll = {
    top: 0,
    left: 0
  };
  let cpos = {
    start: {
      x: 0,
      y: 0
    },
    end: {
      x: 0,
      y: 0
    }
  };

  editor.selectMore(1, false, true);
  if (controls.callBeforeContextMenu) controls.callBeforeContextMenu();
  controls.update = updateControls;
  controls.callBeforeContextMenu = containerOnClick;
  controls.end.onclick = null;
  $content.addEventListener('click', containerOnClick);
  editor.session.on('changeScrollTop', updatePosition);
  editor.session.on('changeScrollLeft', updatePosition);
  editor.selection.on('changeCursor', onchange);

  controls.start.ontouchstart = function (e) {
    touchStart.call(this, e, 'start');
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  controls.end.ontouchstart = function (e) {
    touchStart.call(this, e, 'end');
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  setTimeout(() => {
    container.append(controls.start, controls.end, $cm);
    updateControls();
  }, 0);

  function touchStart(e, action) {
    const el = this;

    document.ontouchmove = function (e) {
      e.clientY = e.touches[0].clientY - 28;
      e.clientX = e.touches[0].clientX;
      const ev = new AceMouseEvent(e, editor);
      const pos = ev.getDocumentPosition();
      const range = editor.selection.getRange();

      if (action === 'start') {
        if (pos.row > range.end.row && pos.column >= range.end.column) pos.column = range.end.column - 1;
        if (pos.row > range.end.row) pos.row = range.end.row;
        editor.selection.setSelectionAnchor(pos.row, pos.column);
      } else {
        if (pos.row < range.start.row && pos.column <= range.start.column) pos.column = range.start.column + 1;
        if (pos.row < range.start.row) pos.row = range.start.row;
        editor.selection.moveCursorToPosition(pos);
      }

      editor.renderer.scrollCursorIntoView(pos);
      if (action === 'start') {
        updateControls(action);
      }
    };

    document.ontouchend = function () {
      document.ontouchmove = null;
      document.ontouchend = null;
      el.touchStart = null;
      container.appendChild($cm);
    };
  }

  function updatePosition() {
    const scrollTop = editor.renderer.getScrollTop() - initialScroll.top;
    const scrollLeft = editor.renderer.getScrollLeft() - initialScroll.left;

    update(-scrollLeft, -scrollTop);

  }

  function onchange() {
    setTimeout(() => {
      updateControls('end');
    }, 0);

  }

  function updateControls(mode) {
    const selected = editor.getCopyText();
    if (!selected) {
      return containerOnClick();
    }

    const $singleMode = editor.container.querySelector('.ace_marker-layer>.ace_selection.ace_br15');
    const cursor = $cursor.getBoundingClientRect();
    const scrollTop = editor.renderer.getScrollTop();
    const scrollLeft = editor.renderer.getScrollLeft();

    if ($singleMode) {
      const singleMode = $singleMode.getBoundingClientRect();

      if (mode && typeof mode === 'string') {
        if (mode === 'start') {
          cpos.start.x = singleMode.left;
          cpos.start.y = singleMode.bottom;
          cpos.end.x -= scrollLeft - initialScroll.left;
          cpos.end.y -= scrollTop - initialScroll.top;
        } else {
          cpos.start.x -= scrollLeft - initialScroll.left;
          cpos.start.y -= scrollTop - initialScroll.top;
          cpos.end.x = singleMode.right;
          cpos.end.y = singleMode.bottom;
        }
      } else {
        cpos.start.x = singleMode.left;
        cpos.end.x = singleMode.right;
        cpos.end.y = cpos.start.y = singleMode.bottom;
      }
    } else {
      const $clientStart = editor.container.querySelector('.ace_marker-layer>.ace_selection.ace_br1.ace_start');
      const $clientEnd = editor.container.querySelector('.ace_marker-layer>.ace_selection.ace_br12');

      if ($clientStart && $clientEnd) {
        const clientStart = $clientStart.getBoundingClientRect();
        const clientEnd = $clientEnd.getBoundingClientRect();

        if (mode && typeof mode === 'string') {
          if (mode === 'start') {
            cpos.start.x = clientStart.left;
            cpos.start.y = clientStart.bottom;
            cpos.end.x -= scrollLeft - initialScroll.left;
            cpos.end.y -= scrollTop - initialScroll.top;
          } else {
            cpos.start.x -= scrollLeft - initialScroll.left;
            cpos.start.y -= scrollTop - initialScroll.top;
            cpos.end.x = clientEnd.right;
            cpos.end.y = clientEnd.bottom;
          }

        } else {
          cpos.start.x = clientStart.left;
          cpos.end.x = clientEnd.right;
          cpos.start.y = clientStart.bottom;
          cpos.end.y = clientEnd.bottom;
        }
      } else {
        cpos.start.x = cursor.left;
        cpos.end.x = cursor.right;
        cpos.start.y = cpos.end.y = cursor.bottom;
      }
    }

    initialScroll.top = scrollTop;
    initialScroll.left = scrollLeft;
    controls.checkForColor();
    update();
  }

  function update(left = 0, top = 0) {
    const offset = parseFloat(root.style.marginLeft) || 0;
    controls.start.style.transform = `translate3d(${cpos.start.x + 1 + left - offset}px, ${cpos.start.y + top}px, 0) rotate(-45deg)`;
    controls.end.style.transform = `translate3d(${cpos.end.x + 4 + left - offset}px, ${cpos.end.y + top}px, 0) rotate(45deg)`;

    const cm = {
      left: cpos.end.x + left - offset,
      top: cpos.end.y - (40 + lineHeight) + top
    };
    const containerWidth = innerWidth - 40;
    let scale = 1;

    $cm.style.transform = `translate3d(${cm.left}px, ${cm.top}px, 0) scale(${scale})`;

    const cmClient = $cm.getBoundingClientRect();

    if (cmClient.width > containerWidth) scale = (containerWidth) / cmClient.width;

    if (cmClient.right > containerWidth) {
      cm.left = containerWidth - cmClient.width;
      cm.left = cm.left < 0 ? Math.abs(cm.left) / 2 : cm.left;
    }

    if (cmClient.left < 0) {
      cm.left = 0;
    }

    if (cmClient.right > containerWidth) {
      cm.left = (containerWidth - (cmClient.width * scale)) / 2;
    }

    if (cmClient.top < 0) {
      cm.top = 50;
    }

    $cm.style.transform = `translate3d(${cm.left}px, ${cm.top}px, 0) scale(${scale})`;
  }

  function containerOnClick() {
    controls.start.remove();
    controls.end.remove();
    $cm.remove();

    $content.removeEventListener('click', containerOnClick);
    editor.session.off('changeScrollTop', updatePosition);
    editor.session.off('changeScrollLeft', updatePosition);
    editor.selection.off('changeCursor', onchange);
    controls.start.ontouchstart = null;
    controls.end.ontouchstart = null;
  }
}

export default selectword;