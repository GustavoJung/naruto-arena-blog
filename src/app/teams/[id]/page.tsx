import TeamDetailsClient from './TeamDetailsClient';

export function generateStaticParams() {
    // For static export on GitHub Pages, we return a dummy ID 
    // since teams are managed on the client side via LocalStorage.
    return [{ id: '0' }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TeamDetailsClient id={id} />;
}
