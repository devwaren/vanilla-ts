import { useTSElementEach } from './useTSForEach';
import { useTSSelect } from './useTSSelect';


const useTSHashAnchor = () => {
    const links = useTSSelect('a[href^="#"]') as NodeListOf<HTMLAnchorElement> | null;

    useTSElementEach(
        links!,
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