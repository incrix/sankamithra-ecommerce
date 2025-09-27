"use client";
import { Stack, TextField, IconButton, Box } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { useProducts } from "@/context/ProductContext";
import { useRouter } from "next/navigation";

export default function SearchBarMobile() {
  const { searchTerm, setSearchTerm } = useProducts();
  const router = useRouter();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = () => {
    router.push("/shop#product");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearchSubmit();
    }
  };

  return (
    <Stack
      sx={{
        display: { xs: "flex", md: "none" },
        alignItems: "center",
        justifyContent: "center",
        px: 2, 
        py: 1, 
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: 500, 
        }}
      >
        <TextField
          placeholder="Search for products..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "4px 0 0 4px",
              "& fieldset": {
                borderColor: "#ccc",
              },
              "&:hover fieldset": {
                borderColor: "var(--primary-color)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--primary-color)",
              },
            },
          }}
        />
        <IconButton
          onClick={handleSearchSubmit}
          sx={{
            borderRadius: "0 4px 4px 0",
            backgroundColor: "#000",
            color: "white",
            px: 3,
            "&:hover": {
              backgroundColor: "#000",
              opacity: 0.8,
            },
          }}
        >
          <SearchOutlinedIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
