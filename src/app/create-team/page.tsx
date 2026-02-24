import CreateTeamForm from '@/components/CreateTeamForm';
import styles from './page.module.css';

export default function CreateTeamPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                Monte seu time
            </h1>
            <p className={styles.description}>
                Escolha 3 shinobi do elenco abaixo e descreva sua estratégia vencedora.
            </p>
            <CreateTeamForm />
        </div>
    );
}
