import ImageGallery from '../components/ImageGallery';

export default function Gallery() {
    return (
        <div className="min-h-screen bg-[#f7f4e9] w-full" dir="rtl">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ImageGallery />
            </div>
        </div>
    );
}