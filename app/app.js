const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { timeout } = require('puppeteer');

const link = process.argv[2];
const location = process.argv[3];

// node app.js https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202 "Санкт-Петербург и область"
// node app.js https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-2-5-950g--310778 "Санкт-Петербург и область"
// node app.js https://www.vprok.ru/product/makfa-makfa-izd-mak-spirali-450g--306739 "Санкт-Петербург и область"
// node app.js https://www.vprok.ru/product/greenfield-greenf-chay-gold-ceyl-bl-pak-100h2g--307403 "Санкт-Петербург и область"
// node app.js https://www.vprok.ru/product/chaykofskiy-chaykofskiy-sahar-pesok-krist-900g--308737 "Санкт-Петербург и область"
// node app.js https://www.vprok.ru/product/lavazza-kofe-lavazza-1kg-oro-zerno--450647 "Санкт-Петербург и область"
// node app.js https://www.vprok.ru/product/parmalat-parmal-moloko-pit-ulster-3-5-1l--306634 "Санкт-Петербург и область"

// node app.js https://www.vprok.ru/product/vinograd-kish-mish-1-kg--314623  "Санкт-Петербург и область"

(async () => {
  const links = {
    img: '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_gallery__3dxfq > section > div.GalleryBlock_viewContainerDesktop__TtCFN > div.GalleryBlock_desktopViewContainer__4xBni > div',
    name: '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_title__3hOtE > div:nth-child(2) > h1',
    price:
      '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_informationBlock__vDYCH > div.ProductPage_desktopBuy__cyRrC > div > div > div > div.PriceInfo_root__GX9Xp > span',
    priceOld:
      '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_informationBlock__vDYCH > div.ProductPage_desktopBuy__cyRrC > div > div > div > div.PriceInfo_root__GX9Xp > div > span.Price_price__QzA8L.Price_size_XS__ESEhJ.Price_role_old__r1uT1',
    rating:
      '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_title__3hOtE > div.ProductPage_actionsRow__KE_23 > div > div.ActionsRow_reviewsWrapper__D7I6c > a.ActionsRow_stars__EKt42',
    reviewCount:
      '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > main > div:nth-child(3) > div > div.ProductPage_title__3hOtE > div.ProductPage_actionsRow__KE_23 > div > div.ActionsRow_reviewsWrapper__D7I6c > a.ActionsRow_reviews__AfSj_',
  };
  // const browser = await puppeteer.launch();
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto(link);
  await page.locator('.UiHeaderHorizontalBase_region__2ODCG').click();
  await page.locator(`div ::-p-text(${location})`).click();

  const description = await page.evaluate(
    (res, links) => {
      res.dirName = document.querySelector(links.name).innerText.trim();
      res.price = document.querySelector(links.price).innerText.split(' ')[0].replace(',', '.');
      const oldPrice = document.querySelector(links.priceOld)?.innerText.split(' ')[0].replace(',', '.');
      res.priceOld = oldPrice || res.price;
      res.rating = document.querySelector(links.rating).title.split(' ')[1];
      res.reviewCount = document.querySelector(links.reviewCount).innerText.split(' ')[0];
      return res;
    },
    { dirName: '', price: 0, priceOld: 0, rating: 0, reviewCount: 0 },
    links
  );

  const locationWay = path.resolve(__dirname, location);

  async function writeDate(locationWay, description) {
    const productData = `price = ${description.price}\npriceOld = ${description.priceOld}\nrating = ${description.rating}\nreviewCount = ${description.reviewCount}`;

    try {
      await fs.promises.stat(path.resolve(locationWay, description.dirName));
    } catch (error) {
      await fs.promises.mkdir(path.resolve(locationWay, description.dirName), { recursive: true });
    }

    try {
      await fs.promises.writeFile(path.resolve(locationWay, description.dirName, 'product.txt'), productData);
    } catch (error) {
      console.log(error.message);
    }
  }

  await writeDate(locationWay, description);

  await page.waitForSelector(links.img);
  await page.screenshot({ path: path.resolve(locationWay, description.dirName, 'screenshot.png') }, { timeout: 2000 });
  await browser.close();
})();
