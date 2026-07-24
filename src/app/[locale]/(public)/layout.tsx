import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex flex-1 flex-col pt-16 lg:pt-0">{children}</main>
            <Footer />
        </div>
    );
}