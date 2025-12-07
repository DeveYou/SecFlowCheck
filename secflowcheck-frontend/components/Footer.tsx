import SocialX from '@/assets/social-x.svg';
import SocialInstagram from '@/assets/social-insta.svg';
import SocialLinkedIn from '@/assets/social-linkedin.svg';
import SocialPin from '@/assets/social-pin.svg';
import SocialYoutube from '@/assets/social-youtube.svg';

export const Footer = () => {
  return (
    <footer className="bg-black text-[#BCBCBC] text-sm py-10 text-center">
        <div className="container-mx-auto px-5 md:px-24">
            <nav className="flex flex-col md:flex-row md:justify-center gap-6 mt-6">
                <a href="/about">About</a>
                <a href="/features">Features</a>
                <a href="/updates">Updates</a>
                <a href="/help">Help</a>
            </nav>
            <div className="flex justify-center gap-6 mt-6">
                <SocialX/>
                <SocialInstagram/>
                <SocialLinkedIn/>
                <SocialPin/>
                <SocialYoutube/>
            </div>
            <p className="mt-6">&copy; 2025 Secflowcheck, Inc. All rights reserved.</p>
        </div>
      </footer>
  );
}