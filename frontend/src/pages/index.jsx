export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/Login',
      permanent: false,
    },
  };
}

export default function Home() {
  return null;
}