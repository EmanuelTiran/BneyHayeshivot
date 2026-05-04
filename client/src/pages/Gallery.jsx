import ImageGallery from '../components/ImageGallery';

export default function Gallery() {
    return (
        <div className="min-h-screen bg-[#f7f4e9] w-full" dir="rtl">
            <div className="w-full max-w-lg mx-auto px-4">
                <ImageGallery />
            </div>
        </div>
    );
}