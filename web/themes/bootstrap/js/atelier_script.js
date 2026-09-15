
document.addEventListener('DOMContentLoaded', function() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.atelier-first__slider-item');
    const totalSlides = slides.length;
    const sliderContainer = document.querySelector('.atelier-first__slider-container');

    // Получаем значение gap из CSS
    const gap = parseInt(getComputedStyle(sliderContainer).gap, 10) || 0;

    // Создаем пагинацию
    const paginationContainer = document.createElement('div');
    paginationContainer.classList.add('atelier-first__slider-pagination');

    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('atelier-first__slider-dot');
        dot.dataset.index = index; // Добавляем индекс к каждой точке
        dot.addEventListener('click', () => {
            showSlide(index); // Переключаемся на соответствующий слайд при клике на точку
        });
        paginationContainer.appendChild(dot);
    });

    document.querySelector('.atelier-first__slider').appendChild(paginationContainer); // Добавляем пагинацию в слайдер

    function updateSlideWidths() {
        // Устанавливаем ширину слайдов на 100% при ширине экрана меньше 600px
        if (window.innerWidth < 600) {
            slides.forEach(slide => {
                slide.style.width = '100%'; // Устанавливаем ширину слайда на 100%
            });
            sliderContainer.style.width = '100%'; // Устанавливаем ширину контейнера на 100%
        } else {
            slides.forEach(slide => {
                slide.style.width = ''; // Возвращаем ширину слайда по умолчанию
            });
            let totalWidth = 0;
            slides.forEach(slide => {
                totalWidth += slide.clientWidth; // Суммируем ширины всех слайдов
            });
            sliderContainer.style.width = `${totalWidth + (gap * (totalSlides - 1))}px`; // Учитываем gap
        }

        showSlide(currentSlide); // Обновляем отображаемый слайд
    }

    function updatePagination() {
        const dots = document.querySelectorAll('.atelier-first__slider-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide); // Добавляем класс active для текущего слайда
        });
    }

    function showSlide(index) {
        // Ограничиваем индекс, чтобы не выйти за границы
        if (index >= totalSlides) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = totalSlides - 1;
        } else {
            currentSlide = index;
        }

        const offset = Array.from(slides)
            .slice(0, currentSlide)
            .reduce((acc, slide) => acc + slide.clientWidth, 0); // Вычисляем смещение для текущего слайда

        // Учитываем gap для всех предыдущих слайдов
        const gapOffset = gap * currentSlide;

        sliderContainer.style.transform = `translateX(-${offset + gapOffset}px)`; // применяем смещение
        updatePagination(); // Обновляем пагинацию
    }

    function moveSlide(direction) {
        currentSlide += direction; // Обновляем индекс текущего слайда
        showSlide(currentSlide); // Показываем слайд
    }

    // Привязываем обработчики событий к кнопкам
    const prevButton = document.querySelector('.atelier-first__slider-prev');
    const nextButton = document.querySelector('.atelier-first__slider-next');

    if (prevButton) {
        prevButton.addEventListener('click', function() {
            moveSlide(-1);
        });
    } else {
        console.error('Prev button not found!');
    }

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            moveSlide(1);
        });
    } else {
        console.error('Next button not found!');
    }

    let startX = 0;
    let startY = 0;
    const threshold = 30; // Минимальное расстояние для распознавания свайпа

    function touchStart(event) {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    }

    function touchEnd(event) {
        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // Проверяем, что свайп был горизонтальным и достаточно длинным
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
            if (diffX > 0 && currentSlide > 0) {
                // Свайп вправо
                showSlide(currentSlide - 1);
            } else if (diffX < 0 && currentSlide < slides.length - 1) {
                // Свайп влево
                showSlide(currentSlide + 1);
            }
        }
    }

// Добавляем обработчики событий
    sliderContainer.addEventListener("touchstart", touchStart);
    sliderContainer.addEventListener("touchend", touchEnd);

    // Вычисляем размеры слайдов при загрузке страницы
    updateSlideWidths();
    window.addEventListener('resize', updateSlideWidths); // Обновляем при изменении размера окна
});


document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.atelier-three__item');

    document.querySelectorAll('.atelier-three__item-btn').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            let itemParent = this.closest('.atelier-three__item');
            let modal = itemParent.querySelector('.services_modal');
            let itemTitle = itemParent.querySelector('.atelier-three__item-title');

            // Проверка на ширину экрана
            if (window.innerWidth < 1200) {
                let modalTitleText = modal.querySelector('.services_modal__title').textContent; // Получаем текст из заголовка
                let modalTextContent = modal.querySelector('.services_modal__text').innerHTML; // Получаем структуру с тегами из текста

                let itemTitleText = itemTitle.innerHTML;

                // Ищем мобильное модальное окно
                let atelierThreeParent = itemParent.closest('.atelier-three');
                let mobileModal = atelierThreeParent.querySelector('.services_modal__mob');

                if (mobileModal) {
                    // Вставляем данные в мобильное модальное окно

                    let mobileItemTitle = mobileModal.querySelector('.services_modal__mob-title span');

                    let mobileModalTitle = mobileModal.querySelector('.services_modal__title');
                    let mobileModalText = mobileModal.querySelector('.services_modal__text');

                    if (mobileModalTitle && mobileModalText) {
                        mobileItemTitle.innerHTML = itemTitleText;
                        mobileModalTitle.textContent = modalTitleText; // Копируем текст заголовка
                        mobileModalText.innerHTML = modalTextContent; // Копируем HTML-контент
                    }

                    if (window.innerWidth > 870) {
                        // Вычисляем ширину скролл-бара и добавляем padding-right к body
                        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
                        mobileModal.style.width = `calc(100% - ${scrollBarWidth}px)`;
                    }

                    document.body.classList.add('no-scroll'); // Отключаем прокрутку

                    // Открываем мобильное модальное окно
                    mobileModal.classList.add('active');
                    setTimeout(() => {
                        mobileModal.style.opacity = '1';
                    }, 10);
                    itemParent.style.zIndex = "55";

                    // Находим все кнопки закрытия модальных окон
                    let closeModalBtns = document.querySelectorAll('.services_modal__close');

                    closeModalBtns.forEach(closeModalBtn => {
                        closeModalBtn.addEventListener('click', function(event) {
                            event.stopPropagation();
                            closeMobileModal(mobileModal);
                        });
                    });




                    return; // Останавливаем дальнейшее выполнение для мобильного режима
                }
            } else {
                // Поведение для экранов больше 1200px (десктопная версия)
                let isActive = Array.from(items).some(item => item.classList.contains('active'));

                if (isActive) {
                    items.forEach(item => {
                        let activeModal = item.querySelector('.services_modal');
                        if (item.classList.contains('active')) {
                            closeModal(activeModal, item);
                        }
                    });
                }

                itemParent.classList.add('active');

                setTimeout(() => {
                    modal.style.opacity = '1';
                    itemParent.style.zIndex = "55";
                }, 10);

                let closeModalBtn = modal.querySelector('.services_modal__close');
                if (closeModalBtn) {
                    closeModalBtn.addEventListener('click', function(event) {
                        event.stopPropagation();
                        closeModal(modal, itemParent);
                    });
                }

                document.addEventListener('click', function(event) {
                    if (!modal.contains(event.target) && !itemParent.contains(event.target)) {
                        closeModal(modal, itemParent);
                    }
                });
            }
        });
    });

    function closeModal(modal, itemParent) {
        modal.style.opacity = '0';
        itemParent.style.zIndex = "auto";

        setTimeout(() => {
            itemParent.classList.remove('active');
            let containerParent = itemParent.closest('.atelier-three__container');
            if (containerParent) {
                containerParent.classList.remove('active');
            }
        }, 300);
    }

    // Функция закрытия мобильного модального окна
    function closeMobileModal(mobileModal) {
        mobileModal.style.opacity = '0';

        setTimeout(() => {
            mobileModal.classList.remove('active');
            document.body.classList.remove('no-scroll');
            document.body.style.paddingRight = ''; // Убираем padding после закрытия модального окна
        }, 300);
    }
});


document.addEventListener('DOMContentLoaded', function() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.atelier-three__item');
    const totalSlides = slides.length;
    const sliderContainer = document.querySelector('.atelier-three__container');

    const gap = parseInt(getComputedStyle(sliderContainer).gap, 10) || 0;

    const paginationContainer = document.createElement('div');
    paginationContainer.classList.add('atelier-three__slider-pagination');

    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('atelier-three__slider-dot');
        dot.dataset.index = index;
        dot.addEventListener('click', () => {
            showSlide(index);
        });
        paginationContainer.appendChild(dot);
    });

    document.querySelector('.atelier-three__main-container').appendChild(paginationContainer);

    function updateSlideWidths() {
        if (window.innerWidth < 600) {
            slides.forEach(slide => {
                slide.style.width = '100%';
            });
            sliderContainer.style.width = '100%';
        } else {
            slides.forEach(slide => {
                slide.style.width = '';
            });
            let totalWidth = 0;
            slides.forEach(slide => {
                totalWidth += slide.clientWidth;
            });
            sliderContainer.style.width = `${totalWidth + (gap * (totalSlides - 1))}px`;
        }
        showSlide(currentSlide);
    }

    function updatePagination() {
        const dots = document.querySelectorAll('.atelier-three__slider-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function showSlide(index) {
        if (index >= totalSlides) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = totalSlides - 1;
        } else {
            currentSlide = index;
        }

        const offset = Array.from(slides)
            .slice(0, currentSlide)
            .reduce((acc, slide) => acc + slide.clientWidth, 0);

        const gapOffset = gap * currentSlide;

        sliderContainer.style.transform = `translateX(-${offset + gapOffset}px)`;
        updatePagination();
    }

    function moveSlide(direction) {
        currentSlide += direction;
        showSlide(currentSlide);
    }

    function initSlider() {
        const prevButton = document.querySelector('.atelier-first__slider-prev');
        const nextButton = document.querySelector('.atelier-first__slider-next');

        if (prevButton) {
            prevButton.addEventListener('click', function() {
                moveSlide(-1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function() {
                moveSlide(1);
            });
        }

        updateSlideWidths();
    }

    function checkScreenSize() {
        if (window.innerWidth < 1200) {
            initSlider();
        } else {
            // Удаляем обработчики событий, если ширина больше 1200 пикселей
            const prevButton = document.querySelector('.atelier-first__slider-prev');
            const nextButton = document.querySelector('.atelier-first__slider-next');

            if (prevButton) {
                prevButton.removeEventListener('click', function() {
                    moveSlide(-1);
                });
            }

            if (nextButton) {
                nextButton.removeEventListener('click', function() {
                    moveSlide(1);
                });
            }

            // Убираем пагинацию и сбрасываем слайдер
            paginationContainer.remove();
            sliderContainer.style.transform = '';
            slides.forEach(slide => {
                slide.style.width = '';
            });
        }
    }

    checkScreenSize(); // Проверяем размер экрана при загрузке

    function touchStart(event) {
        startX = event.touches[0].clientX;
    }

    function touchMove(event) {
        let touchX = event.touches[0].clientX;
        let diff = startX - touchX;
        let slideWidth = slides[0].offsetWidth + (window.innerWidth < 730 ? 10 : 20);

        if (Math.abs(diff) > slideWidth / 4) {
            if (diff > 0 && currentSlide < slides.length - 1) {
                showSlide(currentSlide + 1);
            } else if (diff < 0 && currentSlide > 0) {
                showSlide(currentSlide - 1);
            }
            document.removeEventListener("touchmove", touchMove);
        } else {
        }

    }

    function touchEnd() {
        console.log("touchend сработал");
        document.removeEventListener("touchmove", touchMove);
    }


    sliderContainer.addEventListener("touchstart", touchStart);
    sliderContainer.addEventListener("touchmove", touchMove);
    sliderContainer.addEventListener("touchend", touchEnd);
});


document.addEventListener('DOMContentLoaded', function() {
    function initializeSlider({
                                  sliderContainerSelector,
                                  slideSelector,
                                  nextButtonSelector,
                                  prevButtonSelector,
                                  sliderName = '',
                                  pagination = '', // Пагинация передается как строка с классом или отсутствует
                                  startIndex = 0,
                                  menuSelector = '' // Селектор меню для синхронизации
                              }) {
        const sliderContainer = document.querySelector(sliderContainerSelector);
        const slides = document.querySelectorAll(slideSelector);
        const menuItems = menuSelector ? document.querySelectorAll(menuSelector) : [];
        let currentIndex = startIndex;

        // Функция для получения значения gap из стилей
        function getGap() {
            const gapValue = window.getComputedStyle(sliderContainer).gap;
            return parseInt(gapValue) || 0;
        }

        // Функция для обновления положения слайдов
        function updateSliderPosition() {
            const gap = getGap();
            const slideWidth = slides[0].offsetWidth;
            const offset = -(currentIndex * (slideWidth + gap));

            sliderContainer.style.transform = `translateX(${offset}px)`;

            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentIndex);
            });

            if (pagination) {
                updatePagination();
            }

            if (menuItems.length) {
                updateMenu();
            }
        }

        // Функции для смены слайдов
        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSliderPosition();
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateSliderPosition();
        }

        // Обработчики кликов на кнопки
        document.querySelector(nextButtonSelector).addEventListener('click', nextSlide);
        document.querySelector(prevButtonSelector).addEventListener('click', prevSlide);

        // Функция для создания пагинации (выполняется только один раз при загрузке)
        function createPagination() {
            const paginationContainer = document.querySelector(`.${sliderName} .${pagination}`);
            if (paginationContainer) {
                slides.forEach((_, index) => {
                    const dot = document.createElement('div');
                    dot.classList.add(sliderName + '__dot');
                    if (index === currentIndex) {
                        dot.classList.add('active');
                    }
                    dot.addEventListener('click', function() {
                        currentIndex = index;
                        updateSliderPosition();
                    });
                    paginationContainer.appendChild(dot);
                });
            }
        }

        // Функция для обновления класса активной точки (вместо пересоздания элементов)
        function updatePagination() {
            const dots = document.querySelectorAll(`.${sliderName} .${pagination} .${sliderName}__dot`);
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        // Функция для обновления активного пункта меню
        function updateMenu() {
            menuItems.forEach((menuItem, index) => {
                menuItem.classList.toggle('active', index === currentIndex);
            });
        }

        // Обработчики кликов на пункты меню
        if (menuItems.length) {
            menuItems.forEach((menuItem, index) => {
                menuItem.addEventListener('click', function() {
                    currentIndex = index;
                    updateSliderPosition();
                });
            });
        }

        // Начальная настройка при загрузке страницы
        window.addEventListener('load', () => {
            updateSliderPosition();
            if (pagination) {
                createPagination(); // Создаем точки пагинации один раз
            }
        });
    }

    // Инициализация слайдера с синхронизацией меню
    initializeSlider({
        sliderContainerSelector: '.atelier-cat-slider__container',
        slideSelector: '.atelier-cat-slider__item',
        nextButtonSelector: '.atelier-cat-slider__next',
        prevButtonSelector: '.atelier-cat-slider__prev',
        startIndex: 0, // Начальный индекс активного слайда
        menuSelector: '.atelier-seven__left-item' // Селектор пунктов меню
    });
    // Инициализация слайдеров с разными классами и параметрами
    initializeSlider({
        sliderContainerSelector: '.undefault-slider__container',
        slideSelector: '.undefault-slider__item',
        nextButtonSelector: '.undefault-slider__next',
        prevButtonSelector: '.undefault-slider__prev',
        startIndex: 1 // Начальный индекс активного слайда
    });

    // initializeSlider({
    //     sliderContainerSelector: '.atelier-cat-slider__container',
    //     slideSelector: '.atelier-cat-slider__item',
    //     nextButtonSelector: '.atelier-cat-slider__next',
    //     prevButtonSelector: '.atelier-cat-slider__prev',
    //     startIndex: 0 // Начальный индекс активного слайда
    // });

    // Инициализация слайдера с разными параметрами
    initializeSlider({
        sliderContainerSelector: '.reviews-slider__container',
        slideSelector: '.reviews-slider__item',
        nextButtonSelector: '.reviews-slider__next',
        prevButtonSelector: '.reviews-slider__prev',
        sliderName: 'reviews-slider', // Название слайдера
        pagination: 'reviews-slider__pagination', // Класс для пагинации или пустая строка
        startIndex: 0 // Начальный индекс активного слайда
    });

});


document.addEventListener("DOMContentLoaded", function() {
    // Функция для выполнения действий при клике на кнопки
    function handleSliderClick(prevButton, nextButton) {
        // Находим соседний элемент .atelier-cat-slider__sec-container
        const secContainer = this.parentElement.querySelector('.atelier-cat-slider__sec-container');

        // Находим активный элемент .atelier-cat-slider__item.active
        const activeItem = secContainer.querySelector('.atelier-cat-slider__item.active');

        // Узнаем высоту активного элемента
        const activeItemHeight = activeItem.offsetHeight;

        // Находим вложенный элемент .atelier-cat-slider__item-img
        const itemImg = activeItem.querySelector('.atelier-cat-slider__item-img');

        // Узнаем высоту .atelier-cat-slider__item-img
        const itemImgHeight = itemImg.offsetHeight;

        // Вычисляем разницу
        const heightDifference = activeItemHeight - itemImgHeight;

        prevButton.style.bottom = heightDifference + 'px';
        nextButton.style.bottom = heightDifference + 'px';

    }

    // Находим кнопки
    const prevButton = document.querySelector('.atelier-cat-slider__prev');
    const nextButton = document.querySelector('.atelier-cat-slider__next');



    // Проверяем ширину окна и выполняем код, если ширина меньше 900
    if (window.innerWidth < 900) {
        // Добавляем новый обработчик клика к кнопкам
        prevButton.addEventListener('click', function() {
            handleSliderClick.call(this, prevButton, nextButton);
        });
        nextButton.addEventListener('click', function() {
            handleSliderClick.call(this, prevButton, nextButton);
        });

        handleSliderClick.call(prevButton, prevButton, nextButton);
    }
});
