(function (Drupal, drupalSettings, once) {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char];
    });
  }

  function catById(data, id) {
    return (data.categories || []).find(function (cat) {
      return cat.id === id;
    }) || null;
  }

  function loadYmaps(apiKey) {
    return new Promise(function (resolve, reject) {
      if (window.ymaps) {
        window.ymaps.ready(resolve);
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=' + encodeURIComponent(apiKey);
      script.async = true;
      script.onload = function () {
        window.ymaps.ready(resolve);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  Drupal.behaviors.infraMap = {
    attach: function (context) {
      once('infra-map', '#infraMap', context).forEach(function (root) {
        var settings = drupalSettings.infraMap || {};
        var canEdit = root.getAttribute('data-can-edit') === '1';
        var catsEl = root.querySelector('[data-infra-cats]');
        var legendEl = root.querySelector('[data-infra-legend]');
        var allBtn = root.querySelector('[data-infra-all]');
        var toggle = root.querySelector('#infra-map-toggle');
        var editToggle = root.querySelector('[data-infra-edit]');
        var editCat = root.querySelector('[data-infra-edit-cat]');
        var editTitle = root.querySelector('[data-infra-edit-title]');
        var editList = root.querySelector('[data-infra-list]');
        var deleteBtn = root.querySelector('[data-infra-delete]');
        var saveBtn = root.querySelector('[data-infra-save]');
        var statusEl = root.querySelector('[data-infra-status]');
        var stageEl = root.querySelector('[data-infra-stage]');
        var fsBtn = root.querySelector('[data-infra-fs]');
        var activeCat = 'all';
        var infraOn = true;
        var editing = false;
        var selectedId = '';
        var ignoreMapClick = false;
        var data = { center: [55.9194, 36.8686], zoom: 14, categories: [], points: [] };
        var map = null;
        var collection = null;
        var placemarks = {};

        function setStatus(text) {
          if (statusEl) {
            statusEl.textContent = text || '';
          }
        }

        function visiblePoints() {
          return (data.points || []).filter(function (point) {
            if (point.pinned) {
              return true;
            }
            if (!infraOn) {
              return false;
            }
            return activeCat === 'all' || point.category === activeCat;
          });
        }

        function renderFilters() {
          if (catsEl) {
            catsEl.innerHTML = '';
            data.categories.forEach(function (cat) {
              var btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'infra-map__cat' + (activeCat === cat.id ? ' is-active' : '');
              btn.innerHTML = '<span class="infra-map__cat-icon" style="background:' + esc(cat.color) + '"><img src="' + esc(cat.icon) + '" alt=""></span><span>' + esc(cat.label) + '</span>';
              btn.addEventListener('click', function () {
                activeCat = cat.id;
                renderFilters();
                refreshPins();
              });
              catsEl.appendChild(btn);
            });
          }
          if (allBtn) {
            allBtn.classList.toggle('is-active', activeCat === 'all');
          }
          if (legendEl) {
            legendEl.innerHTML = data.categories.map(function (cat) {
              return '<div class="infra-map__legend-item"><span class="infra-map__legend-dot" style="background:' + esc(cat.color) + '"><img src="' + esc(cat.icon) + '" alt=""></span>' + esc(cat.label) + '</div>';
            }).join('');
          }
          if (editCat) {
            var current = editCat.value;
            editCat.innerHTML = data.categories.map(function (cat) {
              return '<option value="' + esc(cat.id) + '">' + esc(cat.label) + '</option>';
            }).join('');
            if (current && catById(data, current)) {
              editCat.value = current;
            }
          }
          renderList();
        }

        function renderList() {
          if (!editList) {
            return;
          }
          if (!data.points.length) {
            editList.innerHTML = '<p class="infra-map__edit-empty">Точек пока нет.</p>';
            return;
          }
          editList.innerHTML = data.points.map(function (point) {
            var cat = catById(data, point.category);
            var active = point.id === selectedId ? ' is-selected' : '';
            return '<button type="button" class="infra-map__edit-item' + active + '" data-id="' + esc(point.id) + '">' +
              '<span class="infra-map__edit-dot" style="background:' + esc(cat ? cat.color : '#917357') + '"></span>' +
              '<span>' + esc(point.title) + '</span></button>';
          }).join('');
          editList.querySelectorAll('[data-id]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              selectPoint(btn.getAttribute('data-id'), true);
            });
          });
        }

        function pinHtml(cat, selected) {
          var color = cat ? cat.color : '#917357';
          var icon = cat ? cat.icon : '';
          return '<div class="infra-map-pin' + (selected ? ' is-selected' : '') + '">' +
            '<div class="infra-map-pin__body" style="background:' + color + '"><img src="' + icon + '" alt=""></div>' +
            '<div class="infra-map-pin__tail" style="background:' + color + '"></div>' +
            '</div>';
        }

        function refreshPins() {
          if (!collection || !window.ymaps) {
            return;
          }
          collection.removeAll();
          placemarks = {};
          visiblePoints().forEach(function (point) {
            var cat = catById(data, point.category);
            var layout = ymaps.templateLayoutFactory.createClass(pinHtml(cat, point.id === selectedId));
            var placemark = new ymaps.Placemark(point.coords, {
              hintContent: point.title,
              balloonContentHeader: point.title,
              balloonContentBody: cat ? cat.label : ''
            }, {
              iconLayout: layout,
              iconOffset: [-22, -52],
              iconShape: {
                type: 'Rectangle',
                coordinates: [[-22, -52], [22, 0]]
              },
              hideIconOnBalloonOpen: false
            });
            placemark.events.add('click', function (event) {
              ignoreMapClick = true;
              if (editing) {
                event.preventDefault();
                selectPoint(point.id, false);
              }
            });
            collection.add(placemark);
            placemarks[point.id] = placemark;
          });
          if (deleteBtn) {
            deleteBtn.hidden = !selectedId;
          }
        }

        function selectPoint(id, pan) {
          var point = data.points.find(function (item) {
            return item.id === id;
          });
          if (!point) {
            return;
          }
          selectedId = id;
          if (editTitle) {
            editTitle.value = point.title;
          }
          if (editCat) {
            editCat.value = point.category;
          }
          renderList();
          refreshPins();
          if (pan && map) {
            map.setCenter(point.coords, Math.max(map.getZoom(), 14), { duration: 200 });
          }
          if (deleteBtn) {
            deleteBtn.hidden = false;
          }
        }

        function uid() {
          return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        }

        function bindEditor() {
          if (!canEdit || !map) {
            return;
          }
          map.events.add('click', function (event) {
            var coords = event.get('coords');
            window.setTimeout(function () {
              if (ignoreMapClick) {
                ignoreMapClick = false;
                return;
              }
              if (!editing) {
                return;
              }
              var title = editTitle ? editTitle.value.trim() : '';
              if (!title) {
                setStatus('Сначала введите название точки.');
                if (editTitle) {
                  editTitle.focus();
                }
                return;
              }
              var catId = editCat ? editCat.value : (data.categories[0] && data.categories[0].id);
              var point = {
                id: uid(),
                category: catId,
                title: title,
                coords: coords,
                pinned: false
              };
              data.points.push(point);
              selectedId = point.id;
              refreshPins();
              renderList();
              setStatus('Точка добавлена. Не забудьте сохранить JSON.');
            }, 0);
          });
        }

        function applyFormToSelected() {
          if (!selectedId) {
            return;
          }
          var point = data.points.find(function (item) {
            return item.id === selectedId;
          });
          if (!point) {
            return;
          }
          if (editTitle) {
            point.title = editTitle.value.trim() || point.title;
          }
          if (editCat) {
            point.category = editCat.value;
          }
          refreshPins();
          renderList();
        }

        function save() {
          if (!settings.saveUrl) {
            return;
          }
          if (map) {
            data.center = map.getCenter();
            data.zoom = map.getZoom();
          }
          applyFormToSelected();
          setStatus('Сохраняем…');
          fetch(settings.saveUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': settings.csrf || ''
            },
            body: JSON.stringify(data)
          }).then(function (response) { return response.json(); }).then(function (json) {
            if (json.ok) {
              data = json.data;
              renderFilters();
              refreshPins();
              setStatus('Сохранено.');
            }
            else {
              setStatus('Не удалось сохранить.');
            }
          }).catch(function () {
            setStatus('Ошибка сети.');
          });
        }

        function isFullscreen() {
          return !!(stageEl && stageEl.classList.contains('is-fullscreen'));
        }

        function syncFullscreenUi() {
          var open = isFullscreen();
          if (fsBtn) {
            fsBtn.setAttribute('aria-label', open ? 'Свернуть карту' : 'Раскрыть карту на весь экран');
            fsBtn.setAttribute('title', open ? 'Свернуть' : 'На весь экран');
            fsBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
          }
          if (map) {
            window.requestAnimationFrame(function () {
              map.container.fitToViewport();
            });
          }
        }

        function requestFullscreen() {
          if (!stageEl) {
            return;
          }
          stageEl.classList.add('is-fullscreen');
          document.body.classList.add('infra-map-fs-open');
          syncFullscreenUi();
        }

        function exitFullscreen() {
          if (stageEl) {
            stageEl.classList.remove('is-fullscreen');
          }
          document.body.classList.remove('infra-map-fs-open');
          syncFullscreenUi();
        }

        function toggleFullscreen() {
          if (isFullscreen()) {
            exitFullscreen();
          }
          else {
            requestFullscreen();
          }
        }

        function initMap() {
          map = new ymaps.Map('infra-map-canvas', {
            center: data.center || [55.9194, 36.8686],
            zoom: data.zoom || 14,
            controls: []
          }, {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true
          });
          map.controls.add('zoomControl', {
            position: { right: 24, top: 80 }
          });
          collection = new ymaps.GeoObjectCollection();
          map.geoObjects.add(collection);
          refreshPins();
          bindEditor();
          syncFullscreenUi();
        }

        if (allBtn) {
          allBtn.addEventListener('click', function () {
            activeCat = 'all';
            renderFilters();
            refreshPins();
          });
        }
        if (toggle) {
          toggle.addEventListener('change', function () {
            infraOn = toggle.checked;
            refreshPins();
          });
        }
        if (editToggle) {
          editToggle.addEventListener('change', function () {
            editing = editToggle.checked;
            root.classList.toggle('is-editing', editing);
            setStatus(editing ? 'Режим редактирования включён.' : '');
          });
        }
        if (editTitle) {
          editTitle.addEventListener('change', applyFormToSelected);
        }
        if (editCat) {
          editCat.addEventListener('change', applyFormToSelected);
        }
        if (deleteBtn) {
          deleteBtn.addEventListener('click', function () {
            if (!selectedId) {
              return;
            }
            data.points = data.points.filter(function (point) {
              return point.id !== selectedId;
            });
            selectedId = '';
            if (editTitle) {
              editTitle.value = '';
            }
            refreshPins();
            renderList();
            setStatus('Точка удалена. Сохраните JSON, чтобы зафиксировать.');
          });
        }
        if (saveBtn) {
          saveBtn.addEventListener('click', save);
        }
        if (fsBtn) {
          fsBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleFullscreen();
          });
        }
        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && isFullscreen()) {
            exitFullscreen();
          }
        });

        fetch(settings.dataUrl || '/infra-map/data')
          .then(function (response) { return response.json(); })
          .then(function (json) {
            data = json;
            renderFilters();
            return loadYmaps(settings.apiKey || '');
          })
          .then(initMap)
          .catch(function () {
            setStatus('Не удалось загрузить карту.');
          });
      });
    }
  };
})(Drupal, drupalSettings, once);
