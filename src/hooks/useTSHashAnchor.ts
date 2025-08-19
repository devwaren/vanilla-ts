import { useTSElementEach } from './useTSForEach';


const useTSHashAnchor = () => {
    const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

    useTSElementEach(
        links,
        ['click'],
        (element, e) => {
            e.preventDefault();
            const targetId = element.getAttribute('href')?.substring(1);
            const targetElement = targetId ? document.getElementById(targetId) : null;

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    );
}

export { useTSHashAnchor }