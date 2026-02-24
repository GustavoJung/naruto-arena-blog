'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TeamDetailsClient from './TeamDetailsClient';

function TeamDetailsWrapper() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || '';
    return <TeamDetailsClient id={id} />;
}

export default function TeamDetailsPage() {
    return (
        <Suspense fallback={<div className="p-10 text-white text-center">Carregando detalhes do time...</div>}>
            <TeamDetailsWrapper />
        </Suspense>
    );
}
