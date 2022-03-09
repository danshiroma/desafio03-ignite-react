import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const totalWords = post.data.content.reduce((acc, current) => {
    const body = RichText.asText(current.body);
    const { heading } = current;
    const wordCounter = heading.split(' ').length + body.split(' ').length;
    acc += wordCounter;

    return acc;
  }, 0);

  const estimatedTime = Math.ceil(totalWords / 200);

  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <section className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.postInfo}>
            <FiCalendar color="#BBBBBB" />
            <p>
              {format(parseISO(post.first_publication_date), 'd MMM y ', {
                locale: ptBR,
              })}
            </p>
            <FiUser color="#BBBBBB" />
            <p>{post.data.author}</p>
            <FiClock color="#BBBBBB" />
            <p>{estimatedTime} min</p>
          </div>
          {post.data.content.map(post => (
            <div className={styles.content} key={post.heading}>
              <h3>{post.heading}</h3>
              {post.body.map(body => (
                <p key={body.text}>{body.text}</p>
              ))}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: [
        'posts.uid',
        'posts.first_publication_date',
        'posts.title',
        'posts.subtitle',
        'posts.banner',
        'posts.author',
        'posts.content',
      ],
      pageSize: 100,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        const { heading, body } = content;
        return { heading, body };
      }),
    },
  };

  return { props: { post }, revalidate: 60 * 60 };
};
