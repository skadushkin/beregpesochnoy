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

  function filterCats(data) {
    return (data.categories || []).filter(function (cat) {
      return cat.id !== 'village';
    });
  }

  function villageOf(data) {
    return (data.points || []).find(function (point) {
      return point.id === 'village' || point.category === 'village';
    }) || (data.points || []).find(function (point) {
      return point.pinned;
    }) || null;
  }

  function haversineKm(from, to) {
    if (!from || !to || from.length < 2 || to.length < 2) {
      return null;
    }
    var toRad = Math.PI / 180;
    var dLat = (to[0] - from[0]) * toRad;
    var dLon = (to[1] - from[1]) * toRad;
    var lat1 = from[0] * toRad;
    var lat2 = to[0] * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function formatDistance(km) {
    if (km == null || Number.isNaN(km)) {
      return '';
    }
    if (km < 1) {
      return Math.round(km * 1000) + ' м от посёлка';
    }
    return km.toFixed(1).replace('.', ',') + ' км от посёлка';
  }

  function isVillage(point) {
    return !!(point && (point.id === 'village' || point.category === 'village'));
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
        var infoEl = root.querySelector('[data-infra-info]');
        var infoTitle = root.querySelector('[data-infra-info-title]');
        var infoCat = root.querySelector('[data-infra-info-cat]');
        var infoDist = root.querySelector('[data-infra-info-dist]');
        var infoText = root.querySelector('[data-infra-info-text]');
        var infoClose = root.querySelector('[data-infra-info-close]');
        var editText = root.querySelector('[data-infra-edit-text]');
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
          var cats = filterCats(data);
          if (catsEl) {
            catsEl.innerHTML = '';
            cats.forEach(function (cat) {
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
            var legendCats = (data.categories || []).slice();
            legendEl.innerHTML = legendCats.map(function (cat) {
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

        function pinHtml(point, cat, selected) {
          var village = isVillage(point);
          var color = village ? '#FFFBF3' : (cat ? cat.color : '#917357');
          var tail = village ? '#917357' : color;
          var icon = village
            ? '/sites/default/files/img/logo_mob2.svg'
            : (cat ? cat.icon : '');
          var extra = village ? ' infra-map-pin--village' : '';
          return '<div class="infra-map-pin' + extra + (selected ? ' is-selected' : '') + '">' +
            '<div class="infra-map-pin__body" style="background:' + color + '"><img src="' + icon + '" alt="" onerror="this.src=\'/themes/bootstrap/landing-v2/img/infra-map/icon-village.svg\'"></div>' +
            '<div class="infra-map-pin__tail" style="background:' + tail + '"></div>' +
            '</div>';
        }

        function hideInfo() {
          if (infoEl) {
            infoEl.hidden = true;
          }
        }

        function showInfo(point) {
          if (!infoEl || !point) {
            return;
          }
          var cat = catById(data, point.category);
          var origin = villageOf(data);
          var dist = '';
          if (origin && !isVillage(point)) {
            dist = formatDistance(haversineKm(origin.coords, point.coords));
          }
          if (infoCat) {
            infoCat.textContent = isVillage(point) ? 'Посёлок' : (cat ? cat.label : '');
          }
          if (infoTitle) {
            infoTitle.textContent = point.title || '';
          }
          if (infoDist) {
            infoDist.textContent = dist;
            infoDist.hidden = !dist;
          }
          if (infoText) {
            infoText.textContent = point.text || '';
            infoText.hidden = !point.text;
          }
          infoEl.hidden = false;
        }

        function refreshPins() {
          if (!collection || !window.ymaps) {
            return;
          }
          collection.removeAll();
          placemarks = {};
          visiblePoints().forEach(function (point) {
            var cat = catById(data, point.category);
            var village = isVillage(point);
            var layout = ymaps.templateLayoutFactory.createClass(pinHtml(point, cat, point.id === selectedId));
            var size = village ? 64 : 52;
            var half = village ? 28 : 22;
            var placemark = new ymaps.Placemark(point.coords, {
              hintContent: point.title,
              balloonContentHeader: point.title,
              balloonContentBody: (cat ? cat.label : '') + (point.text ? '<br>' + point.text : '')
            }, {
              iconLayout: layout,
              iconOffset: [-half, -size],
              iconShape: {
                type: 'Rectangle',
                coordinates: [[-half, -size], [half, 8]]
              },
              hideIconOnBalloonOpen: false,
              hasBalloon: false,
              cursor: 'pointer'
            });
            placemark.events.add('click', function (event) {
              ignoreMapClick = true;
              event.preventDefault();
              if (editing) {
                selectPoint(point.id, false);
              }
              showInfo(point);
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
          if (editText) {
            editText.value = point.text || '';
          }
          if (editCat) {
            editCat.value = point.category;
          }
          showInfo(point);
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
              if (ignoreMapClick || !editing) {
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
                text: editText ? editText.value.trim() : '',
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
          if (editText) {
            point.text = editText.value.trim();
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
          map.events.add('click', function () {
            window.setTimeout(function () {
              if (ignoreMapClick) {
                ignoreMapClick = false;
                return;
              }
              if (!editing) {
                hideInfo();
              }
            }, 0);
          });
          refreshPins();
          bindEditor();
          fitMap();
          syncFullscreenUi();
        }

        function fitMap() {
          var points = visiblePoints();
          if (!map || !points.length) {
            return;
          }
          if (points.length === 1) {
            map.setCenter(points[0].coords, 14);
            return;
          }
          var first = points[0].coords;
          var bounds = [[first[0], first[1]], [first[0], first[1]]];
          points.forEach(function (point) {
            bounds[0][0] = Math.min(bounds[0][0], point.coords[0]);
            bounds[0][1] = Math.min(bounds[0][1], point.coords[1]);
            bounds[1][0] = Math.max(bounds[1][0], point.coords[0]);
            bounds[1][1] = Math.max(bounds[1][1], point.coords[1]);
          });
          map.setBounds(bounds, { checkZoomRange: true, zoomMargin: [48, 48, 48, 48] });
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
        if (editText) {
          editText.addEventListener('change', applyFormToSelected);
        }
        if (infoClose) {
          infoClose.addEventListener('click', function (event) {
            event.preventDefault();
            hideInfo();
          });
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
            if (editText) {
              editText.value = '';
            }
            hideInfo();
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
