"use client";
import { Stack, Typography, Button, ButtonGroup } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import HeroCategory from "@/app/components/heroCategory";
import { Quicksand } from "next/font/google";
const quicksand = Quicksand({ subsets: ["latin"] });
import ProductCard from "@/app/components/productCard";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

export default function Product() {
  const searchParams = useSearchParams();
  const search = searchParams.get("id");
  const router = useRouter();
  const [productList, setProductList] = useState([]);
  const [product, setProduct] = useState(null);
  const [itemCount, setItemCount] = useState(1);

  useEffect(() => {
    let productFromLocalStorage = JSON.parse(
      localStorage.getItem("productList")
    );
    if (
      productFromLocalStorage == null ||
      productFromLocalStorage.length === 0
    ) {
      fetch("https://e-com.incrix.com/Sankamithra%20Products/productData.json")
        .then((response) => response.json())
        .then((data) => {
          localStorage.setItem("productList", JSON.stringify(data));
          setProduct(data.filter((product) => product.id == search)[0]);
          setProductList(data);
        });
    } else {
      setProduct(
        productFromLocalStorage.filter((product) => product.id == search)[0]
      );
      setProductList(productFromLocalStorage);
    }
  }, []);

  useEffect(() => {
    productList.length !== 0 &&
      setProduct(productList.filter((product) => product.id == search)[0]);
  }, [search]);

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Stack
        width={"100%"}
        maxWidth={"var(--max-width)"}
        padding={{
          xs: "20px",
          sm: "40px",
          md: "40px",
          lg: "40px",
          xl: "40px 0",
        }}
      >
        <Button
          size="small"
          sx={{
            width: "50px",
            color: "var(--primary-color)",
            mb: "20px",
            textTransform: "none",
          }}
          onClick={() => router.push("/shop")}
          startIcon={<ArrowBackIosNewRoundedIcon />}
        >
          Back
        </Button>
        {product && (
          <Stack
            direction={{
              sm: "column",
              md: "row",
            }}
            gap={{
              sm: 2,
              md: 10,
            }}
            justifyContent={"space-between"}
          >
            <Stack
              width={{
                sm: "100%",
                md: 700,
                lg: 700,
                xl: 1000,
              }}
            >
              <Carousel
                showArrows={true}
                useKeyboardArrows={true}
                interval={5000}
                dynamicHeight={true}
                stopOnHover={true}
                infiniteLoop={true}
                // showStatus={true}
                transitionTime={500}
                showThumbs={true}
                showIndicators={true}
                emulateTouch={true}
                autoPlay={true}
                renderThumbs={(children) =>
                  children.map((item) => {
                    return (
                      <img
                        key={item}
                        src={item.props.children.props.src}
                        alt=""
                      />
                    );
                  })
                }
              >
                {product.image.map((image, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        width: "100%",
                      }}
                    >
                      <img
                        src={`https://e-com.incrix.com/Sankamithra%20Products/${image}`}
                        alt={product.name}
                        layout="responsive"
                      />
                    </div>
                  );
                })}
              </Carousel>
            </Stack>
            <Stack gap={2} width={"100%"}>
              <span
                style={{
                  color: "#F74B81",
                  fontWeight: "bold",
                  fontSize: "14px",
                  backgroundColor: "#FDE0E9",
                  borderRadius: "5px",
                  padding: "5px",
                  width: "70px",
                  textAlign: "center",
                }}
              >
                Sale Off
              </span>
              <Typography
                className={quicksand.className}
                variant={"h4"}
                fontWeight={600}
              >
                {product.name}
              </Typography>
              <Stack direction={"row"} gap={2} alignItems={"center"}>
                <Typography
                  className={quicksand.className}
                  variant={"h5"}
                  fontSize={40}
                  color={"var(--primary-color)"}
                  fontWeight={700}
                >
                  ₹
                  {Math.ceil(
                    product.price - product.price * (product.discount / 100)
                  )}
                </Typography>
                <Typography
                  className={quicksand.className}
                  variant={"h5"}
                  fontSize={20}
                  color={"var(--text-color-trinary)"}
                >
                  <s>₹{product.price}</s>
                </Typography>
                <Typography
                  className={quicksand.className}
                  color={"#FDC040"}
                  variant={"h5"}
                >
                  {product.discount}% off
                </Typography>
              </Stack>
              <Typography
                className={quicksand.className}
                variant={"h6"}
                fontSize={16}
                color={"#7E7E7E"}
              >
                {product.shortDescription}
              </Typography>
              <Stack direction={"row"} gap={2}>
                <ButtonGroup>
                  <Button
                    variant={"contained"}
                    color={"primary"}
                    sx={{
                      backgroundColor: "var(--primary-color)",
                      "&:hover": {
                        backgroundColor: "var(--primary-color)",
                      },
                    }}
                    onClick={() => {
                      itemCount > 1 && setItemCount(itemCount - 1);
                    }}
                  >
                    -
                  </Button>
                  <Typography
                    className={quicksand.className}
                    variant={"h6"}
                    color={"var(--primary-color)"}
                    width={50}
                    textAlign={"center"}
                    fontWeight={600}
                  >
                    {itemCount}
                  </Typography>
                  <Button
                    variant={"contained"}
                    sx={{
                      backgroundColor: "var(--primary-color)",
                      "&:hover": {
                        backgroundColor: "var(--primary-color)",
                      },
                    }}
                    color={"primary"}
                    onClick={() => {
                      setItemCount(itemCount + 1);
                    }}
                  >
                    +
                  </Button>
                </ButtonGroup>
                <Button
                  variant={"contained"}
                  color={"primary"}
                  sx={{
                    backgroundColor: "var(--primary-color)",
                    "&:hover": {
                      backgroundColor: "var(--primary-color)",
                    },
                  }}
                  onClick={() => {
                    let cart = JSON.parse(localStorage.getItem("cart")) || [];
                    let item = cart.filter((item) => item.id == product.id)[0];
                    if (item) {
                      item.count += itemCount;
                    } else {
                      cart.push({ ...product, count: itemCount });
                    }
                    localStorage.setItem("cart", JSON.stringify(cart));
                  }}
                >
                  Add to Cart
                </Button>
              </Stack>
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                gap={2}
                alignItems={{
                  xs: "flex-start",
                  sm: "center",
                }}
              >
                <Stack direction={"row"} gap={1} alignItems={"center"}>
                  <Typography
                    className={quicksand.className}
                    variant={"paragraph"}
                    color={"var(--text-color-trinary)"}
                  >
                    Category:
                  </Typography>
                  <Typography
                    className={quicksand.className}
                    variant={"paragraph"}
                    color={"var(--primary-color)"}
                  >
                    {product.category}
                  </Typography>
                </Stack>
                <Stack direction={"row"} gap={1} alignItems={"center"}>
                  <Typography
                    className={quicksand.className}
                    variant={"paragraph"}
                    color={"var(--text-color-trinary)"}
                  >
                    Stock:
                  </Typography>
                  <Typography
                    className={quicksand.className}
                    variant={"paragraph"}
                    color={"var(--primary-color)"}
                  >
                    {product.countInStock} Items In Stock
                  </Typography>
                </Stack>
                <Stack direction={"row"} gap={1} alignItems={"center"}>
                  <Typography
                    className={quicksand.className}
                    variant={"paragraph"}
                    color={"var(--text-color-trinary)"}
                  >
                    SKU:
                  </Typography>
                  <Typography
                    className={quicksand.className}
                    variant={"paragraph"}
                    color={"var(--primary-color)"}
                  >
                    {product.sku}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            <Stack
              sx={{
                display: {
                  xs: "none",
                  sm: "none",
                  md: "none",
                  lg: "block",
                  xl: "block",
                },
              }}
            >
              <HeroCategory />
            </Stack>
          </Stack>
        )}
        <Stack
          padding={{
            sm: "0px",
            md: "40px",
          }}
          margin={"40px 0"}
          gap={2}
          border={{
            sm: "none",
            md: "1px solid #ECECEC",
          }}
          borderRadius={4}
        >
          <Typography
            className={quicksand.className}
            variant={"h4"}
            fontWeight={600}
          >
            Description
          </Typography>
          <Typography
            color={"var(--text-color-secondary)"}
            className={quicksand.className}
          >
            {product && product.description}
          </Typography>
        </Stack>

        <Stack
          padding={{
            sm: "0px",
            md: "40px",
          }}
          margin={"40px 0"}
          gap={2}
          border={{
            sm: "none",
            md: "1px solid #ECECEC",
          }}
          borderRadius={4}
        >
          <Typography
            className={quicksand.className}
            variant={"h4"}
            fontWeight={600}
          >
            Related Products
          </Typography>
          <Stack
            width={"100%"}
            padding={"40px 0 0 0"}
            display={"flex"}
            direction={"row"}
            flexWrap={"wrap"}
            gap={2}
            justifyContent={{
              xs: "center",
              sm: "flex-start",
            }}
          >
            {product &&
              productList.length != 0 &&
              productList.map((item, index) => {
                return (
                  product.category === item.category &&
                  product.id != item.id && (
                    <ProductCard key={index} product={item} />
                  )
                );
              })}
          </Stack>
        </Stack>
      </Stack>
    </main>
  );
}
