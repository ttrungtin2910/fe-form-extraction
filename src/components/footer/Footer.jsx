const Footer = () => {
  return (
    <div className="flex w-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 pb-4 pt-3 backdrop-blur-xl lg:px-8 xl:flex-row">
      <h5 className="mb-4 text-center text-sm font-medium text-white/70 sm:!mb-0 md:text-lg">
        <p className="mb-4 text-center text-sm text-white/70 sm:!mb-0 md:text-base">
          ©{1900 + new Date().getYear()} COSARI. All Rights Reserved.
        </p>
      </h5>
      <div>
        <ul className="flex flex-wrap items-center gap-3 sm:flex-nowrap md:gap-10">
          <li>
            <a
              target="blank"
              href="mailto:hello@simmmple.com"
              className="text-base font-medium text-white/70 hover:text-white transition-colors"
            >
              Support
            </a>
          </li>
          <li>
            <a
              target="blank"
              href="https://simmmple.com/licenses"
              className="text-base font-medium text-white/70 hover:text-white transition-colors"
            >
              License
            </a>
          </li>
          <li>
            <a
              target="blank"
              href="https://simmmple.com/terms-of-service"
              className="text-base font-medium text-white/70 hover:text-white transition-colors"
            >
              Terms of Use
            </a>
          </li>
          <li>
            <a
              target="blank"
              href="https://blog.horizon-ui.com/"
              className="text-base font-medium text-white/70 hover:text-white transition-colors"
            >
              Blog
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
